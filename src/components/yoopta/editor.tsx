import { useState, useMemo, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import YooptaEditor, { createYooptaEditor, YooptaPlugin, useYooptaEditor } from '@yoopta/editor';
import ActionMenuList from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import Blockquote from '@yoopta/blockquote';
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import NoteLinkPlugin, { SubPagePlugin } from '@/components/yoopta/note-link-plugin';
import { GenericPlaceholderPlugin, AskAIPlugin, GenericPlaceholderRender, ImagePlugin, VideoPlugin, AudioPlugin, FilePlugin, BookmarkPlugin, CodePlugin, TablePlugin } from '@/components/yoopta/custom-plugins';
import { 
  Loader2, Type, Heading1, Heading2, Heading3, List, ListOrdered, Quote, 
  MessageSquare, Code as CodeIcon, Minus, ImageIcon, PlaySquare, Table as TableIcon, 
  Link2, Search, FileText, CheckSquare, ChevronRight, Layout, LayoutGrid, 
  MapPin, BarChart2, BarChart, TrendingUp, PieChart, Hash, ClipboardList, 
  Database, ExternalLink, Sigma, MousePointer2, Layers, RefreshCw, Columns, 
  Sparkles, User, Calendar, Smile 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Local Stable Plugins (to replace missing @yoopta/* modules) ---
const LocalParagraphPlugin = new YooptaPlugin({
  type: 'Paragraph',
  elements: {
    paragraph: {
      render: ({ children, attributes }) => <p {...attributes} className="my-1.5 leading-relaxed text-[15px] text-zinc-800 dark:text-zinc-300 antialiased">{children}</p>,
    },
  },
});

const LocalHeadingPlugin = (type: string, className: string) => new YooptaPlugin({
  type,
  elements: {
    [type.toLowerCase().replace('heading', 'heading-')]: {
      render: ({ children, attributes }) => {
        const Tag = type === 'HeadingOne' ? 'h1' : type === 'HeadingTwo' ? 'h2' : 'h3';
        return <Tag {...attributes} className={cn("font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-2 tracking-tight", className)}>{children}</Tag>;
      },
    },
  },
});

const HeadingOne = LocalHeadingPlugin('HeadingOne', 'text-[32px] font-bold');
const HeadingTwo = LocalHeadingPlugin('HeadingTwo', 'text-[24px] font-semibold');
const HeadingThree = LocalHeadingPlugin('HeadingThree', 'text-[19px] font-semibold');
const HeadingFour = LocalHeadingPlugin('HeadingFour', 'text-[16px] font-semibold text-zinc-400');

// --- Basic Block Plugins ---
const CustomBulletedList = BulletedList.extend({
  elements: {
    'bulleted-list': {
      render: ({ children, attributes }: any) => (
        <ul 
          {...attributes} 
          className="list-disc my-2 text-foreground" 
          style={{ listStyleType: 'disc', listStylePosition: 'outside', paddingLeft: '1.5rem' }}
        >
          {children}
        </ul>
      ),
    },
  },
});

const CustomNumberedList = NumberedList.extend({
  elements: {
    'numbered-list': {
      render: ({ children, attributes }: any) => (
        <ol 
          {...attributes} 
          className="list-decimal my-2 text-foreground" 
          style={{ listStyleType: 'decimal', listStylePosition: 'outside', paddingLeft: '1.5rem' }}
        >
          {children}
        </ol>
      ),
    },
  },
});

const CustomTodoList = TodoList.extend({
  elements: {
    'todo-list': {
      render: ({ children, attributes }: any) => {
        return (
          <div {...attributes} className="flex items-start gap-2 my-1.5 group/todo text-foreground">
            {children}
          </div>
        );
      },
    },
  },
});

const LocalQuotePlugin = new YooptaPlugin({
  type: 'Quote',
  elements: {
    quote: {
      render: ({ children, attributes }) => (
        <blockquote {...attributes} className="border-l-4 border-zinc-700 pl-4 my-4 italic text-zinc-400">
          {children}
        </blockquote>
      ),
    },
  },
});

const Divider = new YooptaPlugin({
  type: 'Divider',
  elements: {
    divider: {
      render: ({ children, attributes }) => (
        <div {...attributes} className="my-8 h-px bg-zinc-800 w-full select-none" contentEditable={false}>
          {children}
        </div>
      ),
      props: { nodeType: 'void' },
    },
  },
});

const Callout = new YooptaPlugin({
  type: 'Callout',
  elements: {
    callout: {
      render: ({ children, attributes }) => (
        <div {...attributes} className="flex items-start gap-3 p-4 my-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 shadow-sm leading-relaxed">
          <div contentEditable={false} className="text-xl pt-0.5 select-none opacity-80">💡</div>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      ),
    },
  },
});

// ToggleList - extracted as a real component so useState persists properly
const ToggleListRender = ({ children, attributes }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div {...attributes} className="my-1 text-foreground">
      <div className="flex items-start gap-1 group/toggle">
        <button 
          contentEditable={false}
          onClick={(e) => { e.preventDefault(); setIsOpen(o => !o); }}
          className="pt-1.5 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-90")} />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="py-1"
            style={{ display: isOpen ? undefined : 'none' }}
          >
            {children}
          </div>
          {!isOpen && (
            <div className="py-1 text-muted-foreground/50 text-sm italic" contentEditable={false}>
              (collapsed)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToggleList = new YooptaPlugin({
  type: 'ToggleList',
  elements: {
    'toggle-list': {
      render: ToggleListRender,
    },
  },
});

// Button block
const ButtonRender = ({ children, attributes }: any) => {
  const [label, setLabel] = useState('Click me');
  const [url, setUrl] = useState('');
  const [editing, setEditing] = useState(true);

  return (
    <div {...attributes} contentEditable={false} className="my-4">
      {editing ? (
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Button</p>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Button label..."
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL (optional)"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => setEditing(false)}
            className="self-start px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-md"
            >
              {label}
            </a>
          ) : (
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-md">
              {label}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Edit
          </button>
        </div>
      )}
      {children}
    </div>
  );
};

const ButtonBlock = new YooptaPlugin({
  type: 'Button',
  elements: {
    'button-block': {
      render: ButtonRender,
      props: { nodeType: 'void' },
    },
  },
});

// Text-based minimalist icons to match the screenshot
const TextIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[14px] font-bold text-zinc-400 select-none tracking-tight">{children}</span>
);

const ICON_MAP: Record<string, any> = {
  'Paragraph': <TextIcon>T</TextIcon>,
  'HeadingOne': <TextIcon>H1</TextIcon>,
  'HeadingTwo': <TextIcon>H2</TextIcon>,
  'HeadingThree': <TextIcon>H3</TextIcon>,
  'HeadingFour': <TextIcon>H4</TextIcon>,
  'BulletedList': <List className="w-[18px] h-[18px] text-zinc-400" />,
  'NumberedList': <ListOrdered className="w-[18px] h-[18px] text-zinc-400" />,
  'TodoList': <CheckSquare className="w-[18px] h-[18px] text-zinc-400" />,
  'ToggleList': <ChevronRight className="w-[18px] h-[18px] text-zinc-400" />,
  'NoteLink': <FileText className="w-[18px] h-[18px] text-zinc-400" />,
  'SubPage': <FileText className="w-[18px] h-[18px] text-zinc-400" />,
  'Callout': <MessageSquare className="w-[18px] h-[18px] text-zinc-400" />,
  'Quote': <Quote className="w-[18px] h-[18px] text-zinc-400" />,
  'Table': <TableIcon className="w-[18px] h-[18px] text-zinc-400" />,
  'Divider': <Minus className="w-[18px] h-[18px] text-zinc-400" />,
  'Image': <ImageIcon className="w-[18px] h-[18px] text-zinc-400" />,
  'Video': <PlaySquare className="w-[18px] h-[18px] text-zinc-400" />,
  'Audio': <PlaySquare className="w-[18px] h-[18px] text-emerald-500" />,
  'Code': <CodeIcon className="w-[18px] h-[18px] text-zinc-400" />,
  'File': <FileText className="w-[18px] h-[18px] text-blue-500" />,
  'FileVault': <Database className="w-[18px] h-[18px] text-emerald-500" />,
  'Bookmark': <Link2 className="w-[18px] h-[18px] text-zinc-400" />,
  'TableView': <TableIcon className="w-[18px] h-[18px] text-blue-500" />,
  'BoardView': <Layout className="w-[18px] h-[18px] text-orange-500" />,
  'GalleryView': <LayoutGrid className="w-[18px] h-[18px] text-purple-500" />,
  'ListView': <List className="w-[18px] h-[18px] text-zinc-500" />,
  'MapView': <MapPin className="w-[18px] h-[18px] text-rose-500" />,
  'VerticalBarChart': <BarChart2 className="w-[18px] h-[18px] text-indigo-500" />,
  'HorizontalBarChart': <BarChart className="w-[18px] h-[18px] text-indigo-500" />,
  'LineChart': <TrendingUp className="w-[18px] h-[18px] text-indigo-500" />,
  'DonutChart': <PieChart className="w-[18px] h-[18px] text-indigo-500" />,
  'NumberChart': <Hash className="w-[18px] h-[18px] text-indigo-500" />,
  'Form': <ClipboardList className="w-[18px] h-[18px] text-emerald-500" />,
  'DatabaseInline': <Database className="w-[18px] h-[18px] text-blue-500" />,
  'DatabaseFullPage': <Database className="w-[18px] h-[18px] text-blue-700" />,
  'LinkedView': <ExternalLink className="w-[18px] h-[18px] text-zinc-400" />,
  'Emoji': <Smile className="w-[18px] h-[18px] text-zinc-400" />,
  'InlineEquation': <Sigma className="w-[18px] h-[18px] text-zinc-400" />,
  // Advanced & Column Icons
  'TOC': <List className="w-[18px] h-[18px] text-zinc-400 opacity-60" />,
  'Equation': <Sigma className="w-[18px] h-[18px] text-zinc-400" />,
  'Button': <MousePointer2 className="w-[18px] h-[18px] text-blue-400" />,
  'Breadcrumb': <ChevronRight className="w-[18px] h-[18px] text-zinc-500" />,
  'Tabs': <Layers className="w-[18px] h-[18px] text-indigo-400" />,
  'SyncedBlock': <RefreshCw className="w-[18px] h-[18px] text-rose-500" />,
  'ToggleH1': <Heading1 className="w-[18px] h-[18px] text-zinc-400" />,
  'ToggleH2': <Heading2 className="w-[18px] h-[18px] text-zinc-400" />,
  'ToggleH3': <Heading3 className="w-[18px] h-[18px] text-zinc-400" />,
  'Columns2': <Columns className="w-[18px] h-[18px] text-zinc-500" />,
  'Columns3': <Columns className="w-[18px] h-[18px] text-zinc-500" />,
  'Columns4': <Columns className="w-[18px] h-[18px] text-zinc-500" />,
  'Columns5': <Columns className="w-[18px] h-[18px] text-zinc-500" />,
  'ColorDefault': <div className="w-4 h-4 rounded-full border border-white/20" />,
  'ColorGray': <div className="w-4 h-4 rounded-full bg-zinc-500" />,
  'ColorBrown': <div className="w-4 h-4 rounded-full bg-amber-700" />,
  'ColorOrange': <div className="w-4 h-4 rounded-full bg-orange-500" />,
  'ColorYellow': <div className="w-4 h-4 rounded-full bg-yellow-400" />,
  'ColorGreen': <div className="w-4 h-4 rounded-full bg-emerald-500" />,
  'ColorBlue': <div className="w-4 h-4 rounded-full bg-blue-500" />,
  'ColorPurple': <div className="w-4 h-4 rounded-full bg-purple-500" />,
  'ColorPink': <div className="w-4 h-4 rounded-full bg-pink-500" />,
  'ColorRed': <div className="w-4 h-4 rounded-full bg-red-500" />,
  'BGDefault': <div className="w-4 h-4 rounded bg-transparent border border-white/20" />,
  'BGGray': <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700" />,
  'BGBrown': <div className="w-4 h-4 rounded bg-[#3f2e25] border border-[#5a4338]" />,
  'BGOrange': <div className="w-4 h-4 rounded bg-[#5c2b00] border border-[#8a4d1a]" />,
  'BGYellow': <div className="w-4 h-4 rounded bg-[#4d3a00] border border-[#7a5d00]" />,
  'BGGreen': <div className="w-4 h-4 rounded bg-[#1c3829] border border-[#2d5a42]" />,
  'BGBlue': <div className="w-4 h-4 rounded bg-[#183447] border border-[#28587b]" />,
  'BGPurple': <div className="w-4 h-4 rounded bg-[#351e42] border border-[#553169]" />,
  'BGPink': <div className="w-4 h-4 rounded bg-[#461a33] border border-[#702a52]" />,
  'BGRed': <div className="w-4 h-4 rounded bg-[#522424] border border-[#7d3737]" />,
  'AskAI': <img src="/Nexaris meida bg trans.png" aria-hidden className="w-5 h-5 object-contain" />,
};

export interface EditorMethods {
  focus: () => void;
}

interface EditorProps {
  value: any;
  onChange: (value: any) => void;
  noteId: string;
  placeholder?: string;
  variant?: 'default' | 'compact';
}

// Custom Render for Yoopta Action Menu
const ACTION_GROUPS = [
  { label: 'Basic blocks', types: ['Paragraph', 'HeadingOne', 'HeadingTwo', 'HeadingThree', 'HeadingFour', 'BulletedList', 'NumberedList', 'TodoList', 'ToggleList', 'Callout', 'Quote', 'Table', 'Divider'] },
  { label: 'Media', types: ['Image', 'Video', 'Audio', 'Code', 'File', 'FileVault', 'Bookmark'] },
  { label: 'Database Views', types: ['TableView', 'BoardView', 'GalleryView', 'ListView', 'MapView', 'VerticalBarChart', 'HorizontalBarChart', 'LineChart', 'DonutChart', 'NumberChart', 'Form', 'DatabaseInline', 'DatabaseFullPage', 'LinkedView'] },
  { label: 'Advanced Blocks', types: ['TOC', 'Equation', 'Button', 'Breadcrumb', 'Tabs', 'SyncedBlock', 'ToggleH1', 'ToggleH2', 'ToggleH3', 'Columns2', 'Columns3', 'Columns4', 'Columns5'] },
  { label: 'Inline', types: ['Mention', 'Date', 'Emoji', 'InlineEquation'] },
  { label: 'Text Colors', types: ['ColorDefault', 'ColorGray', 'ColorBrown', 'ColorOrange', 'ColorYellow', 'ColorGreen', 'ColorBlue', 'ColorPurple', 'ColorPink', 'ColorRed'] },
  { label: 'Background Colors', types: ['BGDefault', 'BGGray', 'BGBrown', 'BGOrange', 'BGYellow', 'BGGreen', 'BGBlue', 'BGPurple', 'BGPink', 'BGRed'] },
  { label: 'AI', types: ['AskAI'] }
];

const DESCRIPTIONS: Record<string, string> = {
  'Paragraph': 'Plain paragraph text',
  'HeadingOne': 'Big section header',
  'HeadingTwo': 'Medium section header',
  'HeadingThree': 'Small section header',
  'HeadingFour': 'Smallest section header',
  'BulletedList': 'Unordered list with bullet points',
  'NumberedList': 'Ordered list with numbers',
  'TodoList': 'Checklist with checkboxes',
  'ToggleList': 'Collapsible items that expand/collapse',
  'SubPage': 'Embed a new nested page inline',
  'Callout': 'Highlighted box with an icon',
  'Quote': 'Indented block for quotations',
  'Table': 'Simple inline table',
  'Divider': 'Horizontal rule to separate sections',
  'NoteLink': 'Reference/link to another page',
  'Image': 'Embed or upload an image',
  'Video': 'Embed or upload a video',
  'Audio': 'Embed or upload audio file',
  'Code': 'Syntax-highlighted code',
  'File': 'Upload or attach any file',
  'FileVault': 'Select a file from your File Vault',
  'Bookmark': 'Rich link preview',
  'TableView': 'Spreadsheet-style database',
  'BoardView': 'Kanban-style card board',
  'GalleryView': 'Card grid with image previews',
  'ListView': 'Simple vertical list',
  'MapView': 'Geographic map view',
  'VerticalBarChart': 'Vertical bar chart',
  'HorizontalBarChart': 'Horizontal bar chart',
  'LineChart': 'Line graph visualization',
  'DonutChart': 'Donut/pie chart visualization',
  'NumberChart': 'Single aggregated number',
  'Form': 'Create a data-entry form',
  'DatabaseInline': 'Insert a database inline',
  'DatabaseFullPage': 'Create database as full page',
  'LinkedView': 'Linked view of data source',
  'TOC': 'Auto-generated page contents',
  'Equation': 'LaTeX equation block',
  'Button': 'Triggers automations',
  'Breadcrumb': 'Shows page hierarchy',
  'Tabs': 'Tabbed sections within page',
  'SyncedBlock': 'Stays in sync across pages',
  'ToggleH1': 'Collapsible heading 1',
  'ToggleH2': 'Collapsible heading 2',
  'ToggleH3': 'Collapsible heading 3',
  'Columns2': '2 columns',
  'Columns3': '3 columns',
  'Columns4': '4 columns',
  'Columns5': '5 columns',
  'Mention': '@ reference to page/data',
  'Date': 'Insert date or reminder',
  'Emoji': 'Insert an emoji',
  'InlineEquation': 'Inline math expression',
  'ColorDefault': 'Default text color',
  'ColorGray': 'Gray text color',
  'ColorBrown': 'Brown text color',
  'ColorOrange': 'Orange text color',
  'ColorYellow': 'Yellow text color',
  'ColorGreen': 'Green text color',
  'ColorBlue': 'Blue text color',
  'ColorPurple': 'Purple text color',
  'ColorPink': 'Pink text color',
  'ColorRed': 'Red text color',
  'BGDefault': 'No background color',
  'BGGray': 'Gray background',
  'BGBrown': 'Brown background',
  'BGOrange': 'Orange background',
  'BGYellow': 'Yellow background',
  'BGGreen': 'Green background',
  'BGBlue': 'Blue background',
  'BGPurple': 'Purple background',
  'BGPink': 'Pink background',
  'BGRed': 'Red background',
  'AskAI': 'Ask Alfred AI assistant',
};

const SHORTCUT_HINTS: Record<string, string> = {
  'HeadingOne': '#',
  'HeadingTwo': '##',
  'HeadingThree': '###',
  'HeadingFour': '####',
  'BulletedList': '-',
  'NumberedList': '1.',
  'TodoList': '[]',
  'ToggleList': '>',
  'Quote': '"',
  'Divider': '---',
  'Code': '```',
  'ToggleH1': '#>',
  'ToggleH2': '##>',
  'ToggleH3': '###>',
  'Mention': '@',
  'AskAI': 'Ctrl+J'
};

const ITEM_HEIGHT = 36; // px per item row (py-1.5 + font ≈ 36px)
const VISIBLE_ITEMS = 4;
const CustomActionMenu = (props: any) => {
  const { actions, onClose, getRootProps, getItemProps, variant } = props;
  const [searchValue, setSearchValue] = useState('');
  const [menuPlacement, setMenuPlacement] = useState<'below' | 'above'>('below');
  const editor = useYooptaEditor();

  const isCompact = variant === 'compact';
  const visibleItemsCount = isCompact ? 3 : 4;
  const itemHeight = 36;

  // Determine whether the menu should open above or below the cursor dynamically
  useEffect(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const menuHeight = 220; // Max active height of menu (input + 4 items)
    const spaceBelow = window.innerHeight - rect.bottom;
    
    setMenuPlacement(spaceBelow < menuHeight ? 'above' : 'below');
  }, [searchValue]);

  const allActions = actions || [];

  const renderAction = (action: any, i: number) => {
    const iconObj = ICON_MAP[action.type] || <FileText className="w-4 h-4" />;
    const shortcut = SHORTCUT_HINTS[action.type];

    const handleClick = (e: React.MouseEvent) => {
      if (!editor) return;

      // ── Color / Background marks — apply as text marks, not blocks ────
      if (action.type.startsWith('Color') || action.type.startsWith('BG')) {
        e.preventDefault();
        const colorName = action.type.replace('Color', '').replace('BG', '').toLowerCase();
        const isBG = action.type.startsWith('BG');
        const COLORS: Record<string, string> = {
          default: 'inherit', gray: '#9b9a97', brown: '#937264', orange: '#ffa726',
          yellow: '#ffd54f', green: '#81c784', blue: '#64b5f6', purple: '#ba68c8',
          pink: '#f06292', red: '#e57373'
        };
        const BG_COLORS: Record<string, string> = {
          default: 'transparent', gray: '#2f2f2f', brown: '#3f2e25', orange: '#5c2b00',
          yellow: '#4d3a00', green: '#1c3829', blue: '#183447', purple: '#351e42',
          pink: '#461a33', red: '#522424'
        };
        const colorCode = isBG ? BG_COLORS[colorName] : COLORS[colorName];
        if (isBG) { (editor as any).toggleMark('highlight', { value: colorCode }); }
        else { (editor as any).toggleMark('color', { value: colorCode }); }
        onClose();
        return;
      }

      // ── Ask AI direct override ──────────────────────────────────────
      if (action.type === 'AskAI') {
        e.preventDefault();
        onClose(); // close slash menu
        window.dispatchEvent(new CustomEvent('open-alfred-ai', { detail: {} }));
        return;
      }

      // ── Universal Slash-Menu Preservation ─────────────────────────────
      if (action.type === 'AskAI') {
        e.preventDefault();
        onClose(); // close slash menu
        const selection = window.getSelection();
        let rect = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).getBoundingClientRect() : null;
        window.dispatchEvent(new CustomEvent('open-alfred-ai', { detail: { rect } }));
         
        // Option to clear the `/Ask` text that the user typed to trigger this:
        const currentBlockId = editor.selection?.[0];
        if (currentBlockId) {
             const currentBlock = editor.getEditorValue()[currentBlockId];
             if (currentBlock && currentBlock.value) {
                const cleanValue = JSON.parse(JSON.stringify(currentBlock.value));
                const searchTriggerText = `/${searchValue || ''}`;
                const scrubNodes = (nodes: any[]) => {
                  for (let i = nodes.length - 1; i >= 0; i--) {
                    if (nodes[i].text !== undefined) {
                       if (nodes[i].text.endsWith(searchTriggerText)) {
                          nodes[i].text = nodes[i].text.slice(0, -searchTriggerText.length);
                       }
                    } else if (nodes[i].children) {
                      scrubNodes(nodes[i].children);
                    }
                  }
                };
                scrubNodes(cleanValue);
                (editor as any).updateBlock(currentBlockId, { value: cleanValue });
             }
        }
        return;
      }

      // ── Universal Additive Logic ──────────────────────────────────────
      const sel = editor.selection;
      const currentBlockId = sel?.[0];
      const currentBlock = currentBlockId ? editor.getEditorValue()[currentBlockId] : null;

      const triggerText = `/${searchValue || ''}`;
      let hasOtherContent = false;
      const checkContent = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.text !== undefined) {
            const cleanText = node.text.replace(triggerText, '').trim();
            if (cleanText.length > 0) hasOtherContent = true;
          } else if (node.children) {
            checkContent(node.children);
          }
        }
      };
      if (currentBlock?.value) checkContent(currentBlock.value);

      // We append AFTER if:
      // 1. It's not a Paragraph (List, Todo, Quote, etc)
      // 2. Or the paragraph already has content
      if (currentBlock && (currentBlock.type !== 'Paragraph' || hasOtherContent)) {
        e.preventDefault();

        // 1. Scrub the `/${searchValue}` raw text from the active block
        if (currentBlock.value) {
           const cleanValue = JSON.parse(JSON.stringify(currentBlock.value));
           const scrubNodes = (nodes: any[]) => {
             for (let i = nodes.length - 1; i >= 0; i--) {
               if (nodes[i].text !== undefined) {
                  if (nodes[i].text.endsWith(triggerText)) {
                     nodes[i].text = nodes[i].text.slice(0, -triggerText.length);
                  }
               } else if (nodes[i].children) {
                 scrubNodes(nodes[i].children);
               }
             }
           };
           // Simplified scrub for reliability
           const deepScrub = (val: any) => {
              if (Array.isArray(val)) return val.map(deepScrub);
              if (val.text !== undefined) {
                return { ...val, text: val.text.replace(triggerText, '').trimEnd() };
              }
              if (val.children) return { ...val, children: deepScrub(val.children) };
              return val;
           };

           const scrubbedValue = deepScrub(currentBlock.value);
           (editor as any).updateBlock(currentBlockId, { value: scrubbedValue });
        }

        // 2. Safely inject the new component underneath
        const isVault = action.type === 'FileVault';
        (editor as any).insertBlock(isVault ? 'File' : action.type, {
          focus: true,
          props: isVault ? { defaultMode: 'vault' } : undefined
        });

        onClose();
        return;
      }

      // ── Primary path (Empty Paragraphs): Native Yoopta handler morphs ──
      const isVault = action.type === 'FileVault';
      if (isVault) {
        e.preventDefault();
        (editor as any).insertBlock('File', { focus: true, props: { defaultMode: 'vault' } });
        onClose();
        return;
      }
      
      const itemProps = getItemProps(action.type);
      if (itemProps?.onClick) {
        itemProps.onClick(e);
        onClose();
        return;
      }

      // ── Absolute last resort fallback ─────────────────────────────────
      e.preventDefault();
      (editor as any).insertBlock({
        type: 'Placeholder',
        props: { type: action.type, label: action.title }
      });
      onClose();
    };

    return (
      <motion.button
        key={action.type}
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-3.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors group text-left outline-none focus:bg-zinc-100 dark:focus:bg-white/[0.06] flex-shrink-0 cursor-pointer"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded bg-transparent transition-colors">
          {iconObj}
        </div>
        <div className="flex items-center flex-1 min-w-0">
          <span className="font-medium text-[14px] text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors leading-tight">{action.title}</span>
          
          {shortcut && (
              <span className="ml-auto text-[11px] text-zinc-600 font-normal opacity-60 group-hover:opacity-100 transition-opacity pr-0.5">{shortcut}</span>
          )}
        </div>
      </motion.button>
    );
};

  // Separate Yoopta's positional shell from the animated container.
  // A CSS transform (motion.div) creates a new containing block, which breaks Yoopta's absolute positioning relative to body.
  const { ref: rootRef, style: rootStyle, ...otherRootProps } = getRootProps();

  const setRefs = (el: HTMLDivElement | null) => {
    if (typeof rootRef === 'function') rootRef(el);
    else if (rootRef) (rootRef as any).current = el;
  };

  const floatStyle: React.CSSProperties = {
    ...rootStyle,
    position: 'absolute',
    transform: menuPlacement === 'above' ? 'translateY(-100%) translateY(-36px)' : 'none',
    zIndex: 999999, // ultra high to guarantee rendering above sibling relative dom elements
  };

  // Collect all filtered actions in display order
  const filteredActions: any[] = [];
  
  const COMPACT_BLOCKS = [
    'Paragraph', 'HeadingOne', 'HeadingTwo', 'BulletedList', 
    'NumberedList', 'TodoList', 'Quote', 'Callout', 'Divider', 'AskAI'
  ];

  const groupsToRender = isCompact 
    ? ACTION_GROUPS.filter(g => ['Basic blocks', 'AI'].includes(g.label))
    : ACTION_GROUPS;

  groupsToRender.forEach((group) => {
    group.types.forEach((type) => {
      // If compact, only allow specific blocks
      if (isCompact && !COMPACT_BLOCKS.includes(type)) return;
      
      const action = allActions.find((a: any) => a.type === type && (!searchValue || a.title?.toLowerCase().includes(searchValue.toLowerCase())));
      if (action) filteredActions.push({ ...action, _group: group.label });
    });
  });

  if (!isCompact) {
    // Uncategorized
    allActions.forEach((a: any) => {
      if (!ACTION_GROUPS.some((g) => g.types.includes(a.type)) && (!searchValue || a.title?.toLowerCase().includes(searchValue.toLowerCase()))) {
        filteredActions.push({ ...a, _group: 'Other' });
      }
    });
  }

  // Group headers inline within the scrollable list
  type ListItem = { kind: 'header'; label: string } | { kind: 'action'; action: any; idx: number };
  const listItems: ListItem[] = [];
  let lastGroup = '';
  filteredActions.forEach((action, idx) => {
    if (action._group !== lastGroup) {
      listItems.push({ kind: 'header', label: action._group });
      lastGroup = action._group;
    }
    listItems.push({ kind: 'action', action, idx });
  });

  const menuContent = (
    <div ref={setRefs} style={floatStyle} {...otherRootProps}>
      <AnimatePresence>
        <motion.div
           initial={{ opacity: 0, y: menuPlacement === 'above' ? 8 : -8, scale: 0.99 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, scale: 0.99 }}
           transition={{ duration: 0.1, ease: 'easeOut' }}
           className={cn(
             "flex flex-col gap-1.5 focus:outline-none absolute z-[999999]",
             isCompact ? "w-[240px]" : "w-[280px]"
           )}
           style={menuPlacement === 'above' ? { flexDirection: 'column-reverse' } : undefined}
        >
          {/* Search Pill */}
          <div className="bg-white dark:bg-[#1a1a1e] border border-black/[0.05] dark:border-white/[0.05] rounded-xl shadow-lg flex items-center px-3.5 h-[36px] gap-1.5">
            <span className="text-zinc-400 dark:text-zinc-500 font-medium text-[14px] leading-none mb-0.5">/</span>
            <div className="flex-1 relative flex items-center">
              <input
                autoFocus
                type="text"
                placeholder="Type to search"
                value={searchValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/^\//, '');
                  setSearchValue(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                }}
                className="w-full bg-transparent border-none outline-none text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-600 font-normal leading-none caret-black dark:caret-white"
              />
            </div>
          </div>

          {/* Item list — fixed to 4 visible rows, scroll for rest */}
          <div className="bg-white dark:bg-[#1f1f1f] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
            <div
              className="overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              style={{ maxHeight: `${visibleItemsCount * itemHeight + 16}px` }}
            >
              {listItems.length === 0 && (
                <div className="px-4 py-3 text-[13px] text-zinc-400 text-center">No results</div>
              )}
              {listItems.map((item, i) =>
                item.kind === 'header' ? (
                  <div key={`h-${item.label}`} className="px-4 pt-2 pb-0.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {item.label}
                  </div>
                ) : (
                  renderAction(item.action, item.idx)
                )
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-black/[0.05] dark:border-white/[0.05]">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-between px-4 h-[38px] hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-colors text-[13px] text-zinc-400 font-medium outline-none"
              >
                <span>Close</span>
                <span className="text-[11px] text-zinc-500 opacity-70">esc</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
  
  return menuContent;
};

const Editor = forwardRef<EditorMethods, EditorProps>(({ value, onChange, noteId, placeholder, variant = 'default' }, ref) => {
  const [isMounted, setIsMounted] = useState(false);

  const MARKS = useMemo(() => [Bold, Italic, CodeMark, Underline, Strike, Highlight], []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { editor, plugins, tools } = useMemo(() => {
    if (!isMounted) return { editor: null, plugins: [], tools: null };

    const resolvedPlugins = [
      LocalParagraphPlugin,
      HeadingOne,
      HeadingTwo,
      HeadingThree,
      HeadingFour,
      CustomBulletedList,
      CustomNumberedList,
      CustomTodoList,
      ToggleList,
      LocalQuotePlugin,
      Divider,
      Callout,
      Blockquote,
      GenericPlaceholderPlugin,
      AskAIPlugin,
      // Functional Media Plugins
      ImagePlugin,
      VideoPlugin,
      AudioPlugin,
      FilePlugin,
      BookmarkPlugin,
      CodePlugin,
      TablePlugin,
      // Advanced Layout Stubs
      new YooptaPlugin({ type: 'ToggleH1', elements: { 'toggle-h1': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'ToggleH2', elements: { 'toggle-h2': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'ToggleH3', elements: { 'toggle-h3': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Columns2', elements: { 'columns-2': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Columns3', elements: { 'columns-3': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Columns4', elements: { 'columns-4': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Columns5', elements: { 'columns-5': { render: GenericPlaceholderRender } } }),
      // Database View Stubs
      new YooptaPlugin({ type: 'TableView', elements: { 'table-view': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'BoardView', elements: { 'board-view': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'GalleryView', elements: { 'gallery-view': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'ListView', elements: { 'list-view': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'MapView', elements: { 'map-view': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'VerticalBarChart', elements: { 'v-bar-chart': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'HorizontalBarChart', elements: { 'h-bar-chart': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'LineChart', elements: { 'line-chart': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'DonutChart', elements: { 'donut-chart': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'NumberChart', elements: { 'number-chart': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Form', elements: { 'form': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'DatabaseInline', elements: { 'db-inline': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'DatabaseFullPage', elements: { 'db-fullpage': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'LinkedView', elements: { 'linked-view': { render: GenericPlaceholderRender } } }),
      // Other Advanced Blocks
      new YooptaPlugin({ type: 'TOC', elements: { 'toc': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Equation', elements: { 'equation': { render: GenericPlaceholderRender } } }),
      ButtonBlock,
      new YooptaPlugin({ type: 'Breadcrumb', elements: { 'breadcrumb': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Tabs', elements: { 'tabs': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'SyncedBlock', elements: { 'synced-block': { render: GenericPlaceholderRender } } }),
      // Inline Stubs
      new YooptaPlugin({ type: 'Mention', elements: { 'mention': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Date', elements: { 'date': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'Emoji', elements: { 'emoji': { render: GenericPlaceholderRender } } }),
      new YooptaPlugin({ type: 'InlineEquation', elements: { 'inline-equation': { render: GenericPlaceholderRender } } }),
    ].filter(p => {
      if (!p) return false;
      const hasPluginElements = p.plugin && p.plugin.elements;
      const hasDirectElements = p.elements;
      
      if (!hasPluginElements && !hasDirectElements) {
        console.error("YOOPTA CRASH PREVENTED: Filtered out malformed plugin", p);
        return false;
      }
      return true;
    });

    console.log(`Yoopta: ${resolvedPlugins.length} plugins ready`);

    const rawTools = {
      ActionMenu: {
        render: (props: any) => <CustomActionMenu {...props} variant={variant} />,
        tool: ActionMenuList,
      },
      Toolbar: {
        render: DefaultToolbarRender,
        tool: Toolbar,
      },
    };

    const resolvedTools: any = {};
    Object.entries(rawTools).forEach(([key, config]: [string, any]) => {
      if (config && config.tool) {
        resolvedTools[key] = config;
      }
    });

    const instance = createYooptaEditor();

    return { 
      editor: instance, 
      plugins: resolvedPlugins, 
      tools: resolvedTools 
    };

  }, [isMounted]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (editor) editor.focus();
    }
  }));

  // Robustly sanitize value to ensure all blocks have a registered plugin
  // This prevents Yoopta from crashing when reading 'elements' of an unregistered plugin
  const sanitizedValue = useMemo(() => {
    if (!value || typeof value !== 'object') return value;
    
    // Build a quick set of available plugin types
    const activeTypes = new Set(plugins.map((p: any) => p.plugin ? p.plugin.type : p.type));
    
    let needsUpdate = false;
    const cleanValue = { ...value };
    
    Object.keys(cleanValue).forEach((blockId) => {
      const block = cleanValue[blockId];
      if (block && block.type && !activeTypes.has(block.type)) {
        console.warn(`[Yoopta] Unregistered block type detected in storage: "${block.type}". Falling back to Paragraph.`);
        cleanValue[blockId] = {
          ...block,
          type: 'Paragraph'
        };
        needsUpdate = true;
      }
    });
    
    return needsUpdate ? cleanValue : value;
  }, [value, plugins]);

  if (!isMounted || !editor || plugins.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Initializing Editor...</span>
      </div>
    );
  }


  return (
    <YooptaEditor
      key={noteId}
      editor={editor}
      plugins={plugins}
      tools={tools}
      marks={MARKS}
      value={sanitizedValue}
      onChange={onChange}
      placeholder={placeholder || "Type '/' for commands..."}
      className="pl-0"
      style={{ width: '100%' }}
    />
  );
});

Editor.displayName = 'Editor';

export default Editor;

