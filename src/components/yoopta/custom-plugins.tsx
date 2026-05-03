'use client';

import { YooptaPlugin, generateId, useYooptaEditor } from '@yoopta/editor';
import { useState, useRef } from 'react';
import { 
  Table, Layout, LayoutGrid, List, MapPin, 
  BarChart2, BarChart, TrendingUp, PieChart, Hash, 
  ClipboardList, Database, ExternalLink, Sigma, 
  MousePointer2, Layers, RefreshCw, Heading1, Heading2, Heading3,
  PlaySquare, FileText, ImageIcon, Upload, X, Link2, CheckSquare, ChevronRight, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Generic Placeholder for unimplemented blocks ───────────────────────────
// (Used for Database views, Charts, etc. that need a backend)

const TYPE_LABELS: Record<string, { label: string; description: string }> = {
  TableView: { label: 'Table View', description: 'Spreadsheet-style database' },
  BoardView: { label: 'Board View', description: 'Kanban-style card board' },
  GalleryView: { label: 'Gallery View', description: 'Card grid with image previews' },
  ListView: { label: 'List View', description: 'Simple vertical list database' },
  MapView: { label: 'Map View', description: 'Geographic map view of database entries' },
  VerticalBarChart: { label: 'Vertical Bar Chart', description: 'Database visualized as a vertical bar chart' },
  HorizontalBarChart: { label: 'Horizontal Bar Chart', description: 'Database visualized as a horizontal bar chart' },
  LineChart: { label: 'Line Chart', description: 'Database visualized as a line graph' },
  DonutChart: { label: 'Donut Chart', description: 'Database visualized as a donut/pie chart' },
  NumberChart: { label: 'Number Chart', description: 'Displays a single aggregated number' },
  Form: { label: 'Form', description: 'Create a form that feeds into a database' },
  DatabaseInline: { label: 'Inline Database', description: 'Insert a database inline in the page' },
  DatabaseFullPage: { label: 'Full Page Database', description: 'Create a database as a full page' },
  LinkedView: { label: 'Linked View', description: 'Linked view of an existing data source' },
  TOC: { label: 'Table of Contents', description: 'Auto-generated list of headings on the page' },
  Equation: { label: 'Block Equation', description: 'Full-width LaTeX math equation block' },
  Breadcrumb: { label: 'Breadcrumb', description: "Shows the page's location in the hierarchy" },
  Tabs: { label: 'Tabs', description: 'Tabbed sections within a page' },
  SyncedBlock: { label: 'Synced Block', description: 'Stays in sync across multiple pages' },
  ToggleH1: { label: 'Toggle Heading 1', description: 'Collapsible heading 1' },
  ToggleH2: { label: 'Toggle Heading 2', description: 'Collapsible heading 2' },
  ToggleH3: { label: 'Toggle Heading 3', description: 'Collapsible heading 3' },
  Columns2: { label: '2 Columns', description: 'Split content into 2 columns' },
  Columns3: { label: '3 Columns', description: 'Split content into 3 columns' },
  Columns4: { label: '4 Columns', description: 'Split content into 4 columns' },
  Columns5: { label: '5 Columns', description: 'Split content into 5 columns' },
  Mention: { label: 'Mention', description: '@ reference to a page or person' },
  Date: { label: 'Date', description: 'Insert a date or reminder' },
  Emoji: { label: 'Emoji', description: 'Insert an emoji' },
  InlineEquation: { label: 'Inline Equation', description: 'Inline math expression' },
};

export const GenericPlaceholderRender = ({ blockId, attributes, children, element }: any) => {
  const blockType = element?.type?.replace('-placeholder', '') || element?.props?.type || 'Generic';
  const lookup = TYPE_LABELS[blockType];
  const label = element?.props?.label || lookup?.label || blockType;
  const type = blockType;
  const description = element?.props?.description || lookup?.description || '';

  const getIcon = () => {
    if (type.includes('Chart')) return <BarChart2 className="w-5 h-5 text-indigo-400" />;
    if (type.includes('View') || type.includes('Database')) return <Database className="w-5 h-5 text-blue-400" />;
    if (type === 'Equation' || type === 'InlineEquation') return <Sigma className="w-5 h-5 text-orange-500" />;
    if (type === 'TOC') return <List className="w-5 h-5 text-zinc-400" />;
    if (type === 'Button') return <MousePointer2 className="w-5 h-5 text-zinc-400" />;
    if (type === 'SyncedBlock') return <RefreshCw className="w-5 h-5 text-rose-500" />;
    if (type === 'Breadcrumb') return <ChevronRight className="w-5 h-5 text-zinc-500" />;
    if (type === 'Tabs') return <Layers className="w-5 h-5 text-indigo-400" />;
    if (type === 'Form') return <ClipboardList className="w-5 h-5 text-emerald-500" />;
    if (type === 'MapView') return <MapPin className="w-5 h-5 text-rose-500" />;
    return <Layers className="w-5 h-5 text-zinc-400" />;
  };

  return (
    <div 
      className="my-4 group relative"
      contentEditable={false}
      {...attributes}
    >
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-not-allowed overflow-hidden"
      >
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 rounded-lg bg-muted text-muted-foreground">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold uppercase tracking-wider select-none">Coming Soon</span>
            </div>
            {description && <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1 font-medium">{description}</p>}
          </div>
        </div>
      </motion.div>
      {children}
    </div>
  );
};

export const GenericPlaceholderPlugin = new YooptaPlugin({
  type: 'Placeholder',
  elements: {
    'placeholder': {
      render: GenericPlaceholderRender,
      props: { nodeType: 'void' },
    },
  },
});

// ─── Image Plugin ─────────────────────────────────────────────────────────────
const ImageRender = ({ blockId, attributes, children, element }: any) => {
  const [src, setSrc] = useState<string>(element.props?.src || '');
  const [caption, setCaption] = useState<string>(element.props?.caption || '');
  const [isEditing, setIsEditing] = useState(!element.props?.src);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSrc(e.target?.result as string);
      setIsEditing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrl = () => {
    if (urlInput.trim()) {
      setSrc(urlInput.trim());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div contentEditable={false} {...attributes} className="my-4">
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-4 bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="p-4 rounded-full bg-muted">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Add an image</p>
            <p className="text-sm text-muted-foreground mt-1">Upload from your device or paste a URL</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </button>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
                placeholder="Or paste image URL..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={handleUrl} className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
                Add
              </button>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div contentEditable={false} {...attributes} className="my-4 group relative">
      <figure className="relative">
        <img
          src={src}
          alt={caption || 'Image'}
          className="max-w-full rounded-xl border border-border object-contain max-h-[600px] w-full"
          onError={() => setIsEditing(true)}
        />
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
        >
          <X className="w-4 h-4" />
        </button>
        <figcaption>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full text-center text-sm text-muted-foreground bg-transparent border-none outline-none mt-2 placeholder:text-muted-foreground/50"
          />
        </figcaption>
      </figure>
      {children}
    </div>
  );
};

export const ImagePlugin = new YooptaPlugin({
  type: 'Image',
  elements: {
    'image': {
      render: ImageRender,
      props: { nodeType: 'void', src: '', caption: '' },
    },
  },
});

// ─── Video Plugin ─────────────────────────────────────────────────────────────
const VideoRender = ({ blockId, attributes, children, element }: any) => {
  const [src, setSrc] = useState<string>(element.props?.src || '');
  const [isEditing, setIsEditing] = useState(!element.props?.src);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const getEmbedSrc = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  const isEmbed = src && (src.includes('youtube') || src.includes('youtu.be') || src.includes('vimeo'));

  if (isEditing) {
    return (
      <div contentEditable={false} {...attributes} className="my-4">
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-4 bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="p-4 rounded-full bg-muted">
            <PlaySquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Add a video</p>
            <p className="text-sm text-muted-foreground mt-1">Upload a video file or paste a YouTube/Vimeo URL</p>
          </div>
          <div className="flex gap-2 w-full max-w-sm">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) { setSrc(urlInput.trim()); setIsEditing(false); } }}
              placeholder="YouTube, Vimeo, or direct video URL..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => { if (urlInput.trim()) { setSrc(urlInput.trim()); setIsEditing(false); } }} className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
              Add
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div contentEditable={false} {...attributes} className="my-4 group relative">
      {isEmbed ? (
        <div className="relative pt-[56.25%] rounded-xl overflow-hidden border border-border">
          <iframe
            src={getEmbedSrc(src)}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <video src={src} controls className="max-w-full rounded-xl border border-border w-full max-h-[500px]" />
      )}
      <button
        onClick={() => { setSrc(''); setIsEditing(true); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
      >
        <X className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
};

export const VideoPlugin = new YooptaPlugin({
  type: 'Video',
  elements: {
    'video': {
      render: VideoRender,
      props: { nodeType: 'void', src: '' },
    },
  },
});

// ─── Audio Plugin ─────────────────────────────────────────────────────────────
const AudioRender = ({ blockId, attributes, children, element }: any) => {
  const [src, setSrc] = useState<string>(element.props?.src || '');
  const [isEditing, setIsEditing] = useState(!element.props?.src);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (isEditing) {
    return (
      <div contentEditable={false} {...attributes} className="my-4">
        <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-4 bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="p-3 rounded-full bg-emerald-500/10">
            <PlaySquare className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="font-medium text-foreground text-sm">Add an audio file</p>
          <div className="flex gap-2 w-full max-w-sm">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) { setSrc(urlInput.trim()); setIsEditing(false); } }}
              placeholder="Paste audio URL..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => { if (urlInput.trim()) { setSrc(urlInput.trim()); setIsEditing(false); } }} className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
              Add
            </button>
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { const url = URL.createObjectURL(file); setSrc(url); setIsEditing(false); }
          }} />
          <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
            Or upload from device
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div contentEditable={false} {...attributes} className="my-4 group relative p-4 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-emerald-500/10">
          <PlaySquare className="w-5 h-5 text-emerald-500" />
        </div>
        <audio src={src} controls className="flex-1" />
        <button onClick={() => { setSrc(''); setIsEditing(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      {children}
    </div>
  );
};

export const AudioPlugin = new YooptaPlugin({
  type: 'Audio',
  elements: {
    'audio': {
      render: AudioRender,
      props: { nodeType: 'void', src: '' },
    },
  },
});

// ─── File Plugin ──────────────────────────────────────────────────────────────
const FileRender = ({ blockId, attributes, children, element }: any) => {
  const { vaultFiles } = useApp();
  const [file, setFile] = useState<{ name: string; size: number; url: string; vaultId?: string } | null>(element.props?.file || null);
  const [isEditing, setIsEditing] = useState(!element.props?.file);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'vault'>(element.props?.defaultMode || 'upload');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (isEditing) {
    return (
      <div contentEditable={false} {...attributes} className="my-4">
        <div className="border border-border rounded-xl bg-muted/10 overflow-hidden shadow-sm">
          <div className="flex border-b border-border bg-muted/20">
            <button 
              onClick={() => setMode('upload')}
              className={cn("flex-1 py-2 text-sm font-medium transition-colors border-b-2", mode === 'upload' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/30")}
            >
              Upload
            </button>
            <button 
              onClick={() => setMode('vault')}
              className={cn("flex-1 py-2 text-sm font-medium transition-colors border-b-2", mode === 'vault' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/30")}
            >
              File Vault
            </button>
          </div>

          <div className="p-6">
            {mode === 'upload' ? (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <div className="p-4 rounded-full bg-blue-500/10">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Upload a file</p>
                  <p className="text-sm text-muted-foreground mt-1">Select from computer</p>
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setFile({ name: f.name, size: f.size, url });
                    setIsEditing(false);
                  }
                }} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-foreground px-1">Select from File Vault</p>
                {vaultFiles.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground border rounded-lg border-dashed bg-muted/30">
                    Your File Vault is empty.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {vaultFiles.map(vf => (
                      <div 
                        key={vf.id} 
                        onClick={async () => {
                          const { getFileContent } = await import('@/lib/indexed-db');
                          const content = await getFileContent(vf.id);
                          if (content) {
                            setFile({ name: vf.name, size: vf.size, url: content, vaultId: vf.id });
                            setIsEditing(false);
                          } else {
                            alert('Could not load file from vault.');
                          }
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-primary/50 cursor-pointer transition-all group"
                      >
                        <FileText className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100" />
                        <span className="text-sm font-medium flex-1 truncate">{vf.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{formatSize(vf.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div contentEditable={false} {...attributes} className="my-4 group">
      <a
        href={file?.url}
        download={file?.name}
        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors group/file"
      >
        <div className="p-2 rounded-lg bg-blue-500/10">
          <FileText className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{file?.name}</p>
          {file?.size && <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); setIsEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-muted"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </a>
      {children}
    </div>
  );
};

export const FilePlugin = new YooptaPlugin({
  type: 'File',
  elements: {
    'file': {
      render: FileRender,
      props: { nodeType: 'void', file: null, defaultMode: 'upload' },
    },
  },
});

// ─── Bookmark Plugin ──────────────────────────────────────────────────────────
const BookmarkRender = ({ blockId, attributes, children, element }: any) => {
  const [url, setUrl] = useState(element.props?.url || '');
  const [isEditing, setIsEditing] = useState(!element.props?.url);
  const [urlInput, setUrlInput] = useState('');

  if (isEditing) {
    return (
      <div contentEditable={false} {...attributes} className="my-4">
        <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-4 bg-muted/20">
          <Link2 className="w-8 h-8 text-muted-foreground" />
          <p className="font-medium text-foreground text-sm">Web Bookmark</p>
          <div className="flex gap-2 w-full max-w-sm">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) { setUrl(urlInput.trim()); setIsEditing(false); } }}
              placeholder="Paste any web URL..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => { if (urlInput.trim()) { setUrl(urlInput.trim()); setIsEditing(false); } }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Embed
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Extract hostname for display
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch {}

  return (
    <div contentEditable={false} {...attributes} className="my-4 group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors group/bm"
      >
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
          alt=""
          className="w-5 h-5 rounded flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{url}</p>
          {hostname && <p className="text-xs text-muted-foreground">{hostname}</p>}
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover/bm:opacity-100 transition-opacity flex-shrink-0" />
      </a>
      <button
        onClick={() => { setUrl(''); setIsEditing(true); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground"
      >
        Change
      </button>
      {children}
    </div>
  );
};

export const BookmarkPlugin = new YooptaPlugin({
  type: 'Bookmark',
  elements: {
    'bookmark': {
      render: BookmarkRender,
      props: { nodeType: 'void', url: '' },
    },
  },
});

// ─── Code Plugin ──────────────────────────────────────────────────────────────
const CodeRender = ({ blockId, attributes, children, element }: any) => {
  const [language, setLanguage] = useState(element.props?.language || 'javascript');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const code = element.props?.code || '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const LANGS = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'rust', 'go', 'ruby', 'php', 'html', 'css', 'sql', 'bash', 'json', 'yaml', 'markdown', 'plaintext'];

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border group" {...attributes}>
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-border">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          contentEditable={false}
          className="text-xs text-zinc-400 bg-transparent border-none outline-none cursor-pointer hover:text-zinc-200 transition-colors"
        >
          {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button
          contentEditable={false}
          onClick={copyCode}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-zinc-950 overflow-x-auto">
        <code className="text-sm font-mono text-blue-300 leading-relaxed">
          {children}
        </code>
      </pre>
    </div>
  );
};

export const CodePlugin = new YooptaPlugin({
  type: 'Code',
  elements: {
    'code': {
      render: CodeRender,
      props: { language: 'javascript' },
    },
  },
});

// ─── Table Plugin ─────────────────────────────────────────────────────────────
const TableRender = ({ blockId, attributes, children, element }: any) => {
  const [rows, setRows] = useState(element.props?.rows || [['', ''], ['', '']]);
  const [headers, setHeaders] = useState(element.props?.headers || ['Column 1', 'Column 2']);

  const updateCell = (row: number, col: number, value: string) => {
    setRows((prev: string[][]) => prev.map((r, ri) => ri === row ? r.map((c, ci) => ci === col ? value : c) : r));
  };

  const updateHeader = (col: number, value: string) => {
    setHeaders((prev: string[]) => prev.map((h, i) => i === col ? value : h));
  };

  const addRow = () => setRows((prev: string[][]) => [...prev, new Array(headers.length).fill('')]);
  const addCol = () => {
    setHeaders((prev: string[]) => [...prev, `Column ${prev.length + 1}`]);
    setRows((prev: string[][]) => prev.map(r => [...r, '']));
  };

  return (
    <div contentEditable={false} {...attributes} className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm rounded-xl overflow-hidden border border-border">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h: string, i: number) => (
              <th key={i} className="border-b border-border px-3 py-2 text-left">
                <input
                  value={h}
                  onChange={(e) => updateHeader(i, e.target.value)}
                  className="w-full bg-transparent font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder="Header"
                />
              </th>
            ))}
            <th className="border-b border-border px-3 py-2 w-8">
              <button onClick={addCol} className="text-muted-foreground hover:text-foreground text-lg leading-none">+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: string[], ri: number) => (
            <tr key={ri} className="hover:bg-muted/20 transition-colors">
              {row.map((cell: string, ci: number) => (
                <td key={ci} className="border-b border-border px-3 py-2">
                  <input
                    value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50"
                    placeholder="Cell"
                  />
                </td>
              ))}
              <td className="border-b border-border px-3 py-2 w-8" />
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={addRow}
        className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <span className="text-base leading-none">+</span> Add row
      </button>
      {children}
    </div>
  );
};

export const TablePlugin = new YooptaPlugin({
  type: 'Table',
  elements: {
    'table': {
      render: TableRender,
      props: { nodeType: 'void', rows: [['', ''], ['', '']], headers: ['Column 1', 'Column 2'] },
    },
  },
});

// ─── Ask AI Plugin ────────────────────────────────────────────────────────────
const AskAIRender = ({ blockId, attributes, children, element }: any) => {
  return (
    <div 
      className="my-4 group relative"
      contentEditable={false}
      {...attributes}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('open-alfred-ai'));
        }}
        className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-muted border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all cursor-pointer overflow-hidden backdrop-blur-md group/ai"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover/ai:scale-110 transition-transform shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20 overflow-hidden">
            <img src="/Nexaris meida bg trans.png" className="w-8 h-8 object-contain" alt="Nexaris AI" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background animate-bounce" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground tracking-tight text-base">Ask Alfred AI Assistant</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase tracking-widest border border-purple-500/20">Pro</span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5 font-medium opacity-80 group-hover/ai:opacity-100 transition-opacity">Start typing or ask for a draft, summary, or translation...</p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground group-hover/ai:border-purple-500/30 group-hover/ai:text-purple-400 transition-all">
          <span className="text-[11px] font-bold tracking-tighter">⌘ J</span>
        </div>
      </motion.div>
      {children}
    </div>
  );
};

export const AskAIPlugin = new YooptaPlugin({
  type: 'AskAI',
  elements: {
    'ask-ai': {
      render: AskAIRender,
      props: { nodeType: 'void' },
    },
  },
});
