'use client';

import { useState, useMemo, useEffect } from 'react';
import YooptaEditor, { createYooptaEditor } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { BulletedList, NumberedList } from '@yoopta/lists';
import ActionMenuList from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import YooptaImage from '@yoopta/image';
import Code from '@yoopta/code';
import Blockquote from '@yoopta/blockquote';
import Callout from '@yoopta/callout';
import Embed from '@yoopta/embed';
import Table from '@yoopta/table';
import Divider from '@yoopta/divider';
import Link from '@yoopta/link';
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';
import NoteLinkPlugin, { SubPagePlugin } from '@/components/yoopta/note-link-plugin';
import { Loader2, Type, Heading1, Heading2, Heading3, List, ListOrdered, Quote, MessageSquare, Code as CodeIcon, Minus, ImageIcon, PlaySquare, Table as TableIcon, Link2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<string, any> = {
  'Paragraph': <Type className="w-4 h-4" />,
  'HeadingOne': <Heading1 className="w-4 h-4" />,
  'HeadingTwo': <Heading2 className="w-4 h-4" />,
  'HeadingThree': <Heading3 className="w-4 h-4" />,
  'BulletedList': <List className="w-4 h-4" />,
  'NumberedList': <ListOrdered className="w-4 h-4" />,
  'Blockquote': <Quote className="w-4 h-4" />,
  'Callout': <MessageSquare className="w-4 h-4" />,
  'Code': <CodeIcon className="w-4 h-4" />,
  'Divider': <Minus className="w-4 h-4" />,
  'Image': <ImageIcon className="w-4 h-4" />,
  'Embed': <PlaySquare className="w-4 h-4" />,
  'Table': <TableIcon className="w-4 h-4" />,
  'Link': <Link2 className="w-4 h-4" />
};

interface EditorProps {
  value: any;
  onChange: (value: any) => void;
  noteId: string;
  placeholder?: string;
}

// Custom Render for Yoopta Action Menu
const CustomActionMenu = (props: any) => {
  const { actions, onClose, getRootProps, getItemProps } = props;

  const filteredActions = (actions || []).filter((a: any) => {
    if (a.type === 'NoteLink' || a.type === 'SubPage') return false;
    return true;
  });

  return (
    <AnimatePresence>
      <motion.div
        {...getRootProps()}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="w-[320px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden text-sm flex flex-col max-h-[350px]"
      >
        <div className="px-3 pt-3 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Basic Blocks
        </div>
        <div className="overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs font-medium">No blocks found</div>
          ) : (
            filteredActions.map((action: any, i: number) => {
              const iconObj = ICON_MAP[action.type] || action.icon || <div className="w-4 h-4 bg-zinc-200 rounded-sm" />;
              return (
                <button
                  key={action.type}
                  {...getItemProps(action.type)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left outline-none focus:bg-accent focus:text-accent-foreground flex-shrink-0 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform text-muted-foreground group-hover:text-foreground">
                    {iconObj}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-700 dark:text-zinc-200 text-[13px]">{action.title}</span>
                    <span className="text-[11px] text-muted-foreground/60 truncate w-48">{action.description || 'Insert block'}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Editor({ value, onChange, noteId, placeholder }: EditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { editor, plugins, tools } = useMemo(() => {
    if (!isMounted) return { editor: null, plugins: [], tools: null };

    const resolvedPlugins = [
      Paragraph,
      HeadingOne,
      HeadingTwo,
      HeadingThree,
      BulletedList,
      NumberedList,
      Blockquote,
      Callout,
      Code,
      Divider,
      YooptaImage,
      Embed,
      Table,
      Link,
      NoteLinkPlugin,
      SubPagePlugin,
    ];

    console.log(`Yoopta: ${resolvedPlugins.length} plugins ready`);

    const rawTools = {
      ActionMenu: {
        render: (props: any) => <CustomActionMenu {...props} />,
        tool: ActionMenuList,
      },
      Toolbar: {
        render: DefaultToolbarRender,
        tool: Toolbar,
      },
      LinkTool: {
        render: DefaultLinkToolRender,
        tool: LinkTool,
      }
    };

    const resolvedTools: any = {};
    Object.entries(rawTools).forEach(([key, config]: [string, any]) => {
      if (config && config.tool) {
        resolvedTools[key] = config;
      } else {
        console.warn(`Yoopta: Tool ${key} missing tool implementation`);
      }
    });

    const instance = createYooptaEditor();

    return { 
      editor: instance, 
      plugins: resolvedPlugins, 
      tools: resolvedTools 
    };
  }, [isMounted]);

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
      marks={[]}
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Type '/' for commands..."}
      className="pl-0"
      style={{ width: '100%' }}
    />
  );
}

