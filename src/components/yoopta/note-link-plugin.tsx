import { generateId, useYooptaEditor, YooptaPlugin } from '@yoopta/editor';
import { useApp } from '@/components/layout/app-provider';
import type { Note } from '@/lib/types';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type NoteLinkBlockData = {
  id?: string;
  title?: string;
};

type SubPageBlockData = {
  id?: string;
};

const NoteLinkRender = ({ blockId, attributes, children, element }: any) => {
  const router = useRouter();
  const editor = useYooptaEditor();
  // Use global app state for notes
  const { notes } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const elementData = (element?.props?.data ?? {}) as NoteLinkBlockData;
  
  const linkedNote = useMemo(() => {
    if (!elementData || !elementData.id) return null;
    return notes.find((n: Note) => n.id === elementData.id);
  }, [notes, elementData]);

  const previewText = useMemo(() => {
    if (!linkedNote) return '';
    const content = linkedNote.content;
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content !== 'object') return '';
    const blocks = Object.values(content as any);
    const sorted = blocks.sort((a: any, b: any) => {
      const ao = a?.meta?.order ?? 0;
      const bo = b?.meta?.order ?? 0;
      return ao - bo;
    });
    const lines: string[] = [];
    sorted.forEach((block: any) => {
      const value = Array.isArray(block?.value) ? block.value : [];
      value.forEach((node: any) => {
        if (Array.isArray(node?.children)) {
          const text = node.children.map((c: any) => c?.text ?? '').join('');
          if (text.trim().length > 0) {
            lines.push(text);
          }
        }
      });
    });
    return lines.join('\n').trim();
  }, [linkedNote]);

  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    return notes.filter((n: Note) => 
      (n.title || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  const handleSelect = (noteId: string, noteTitle: string) => {
    const updatedElement = {
      ...(element || {}),
      id: element?.id || generateId(),
      type: element?.type || 'note-link',
      props: {
        ...(element?.props || {}),
        data: { id: noteId, title: noteTitle },
      },
    };
    editor.updateBlock(blockId, {
      value: [updatedElement],
    });
    setOpen(false);
    setSearch('');
  };

  const renderNoteList = () => (
    <div className="flex flex-col w-full">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          autoFocus
        />
      </div>
      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
        {filteredNotes.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No pages found.</div>
        ) : (
          filteredNotes.map((note: any) => (
            <div
              key={note.id}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                elementData.id === note.id && "bg-accent text-accent-foreground"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(note.id, note.title);
              }}
            >
              <FileText className="mr-2 h-4 w-4 opacity-50" />
              <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
              {elementData.id === note.id && <Check className="ml-auto h-4 w-4" />}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!elementData.id) {
    return (
      <div 
        className="my-2 relative" 
        contentEditable={false}
        {...attributes}
      >
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-muted-foreground" role="combobox">
              <Search className="mr-2 h-4 w-4" />
              {elementData.title ? `Linked: ${elementData.title}` : "Link a page..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px] bg-background text-foreground border-border" align="start">
            {renderNoteList()}
          </PopoverContent>
        </Popover>
        {children}
      </div>
    );
  }

  return (
    <div 
      className="my-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group select-none relative"
      contentEditable={false}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        
        e.preventDefault();
        e.stopPropagation();

        if (elementData.id) {
          router.push(`/notes?id=${elementData.id}`);
        }
      }}
      onClick={(e) => {
         e.preventDefault();
         e.stopPropagation();
         if (elementData.id) {
           router.push(`/notes?id=${elementData.id}`);
         }
      }}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium break-words">
            {linkedNote ? (linkedNote.title || 'Untitled') : (elementData.title || 'Unknown Page')}
          </div>
          <div className="text-xs text-muted-foreground">
            {linkedNote ? `Last edited ${new Date(linkedNote.updatedAt).toLocaleDateString()}` : 'Page not found'}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {linkedNote && (
        <div className="mt-2 max-h-48 w-full rounded-md bg-muted/40 text-xs text-muted-foreground overflow-y-auto p-2 border border-dashed border-muted-foreground/20">
          <pre className="whitespace-pre-wrap font-sans text-xs">
            {previewText || 'Empty page'}
          </pre>
        </div>
      )}
      <div className="hidden">
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild><span /></PopoverTrigger>
          <PopoverContent className="p-0 w-[300px] bg-background text-foreground border-border" align="end">
            {renderNoteList()}
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  );
};

const NoteLinkPlugin = new YooptaPlugin({
  type: 'NoteLink',
  elements: {
    'note-link': {
      render: NoteLinkRender,
      props: {
        nodeType: 'void',
      },
    },
  },
  options: {
    display: {
      title: 'Link to Page',
      description: 'Link to another page in your notes',
      icon: <FileText className="w-4 h-4" />,
    },
    shortcuts: ['@'],
  },
});

const SubPageRender = ({ blockId, attributes, children, element }: any) => {
  const editor = useYooptaEditor();
  const { notes, setNotes } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const elementData = (element?.props?.data ?? {}) as SubPageBlockData;
  const creatingRef = useRef(false);

  const linkedNote = useMemo(() => {
    if (!elementData || !elementData.id) return null;
    return notes.find((n: Note) => n.id === elementData.id);
  }, [notes, elementData]);

  useEffect(() => {
    if (elementData.id || creatingRef.current) return;
    creatingRef.current = true;
    const id = crypto.randomUUID();
    const parentId = searchParams?.get('id') || undefined;
    
    // Create initial content with a paragraph
    const blockId = generateId();
    const initialContent = {
      [blockId]: {
        id: blockId,
        type: 'Paragraph',
        meta: { order: 0, depth: 0 },
        value: [
          {
            id: generateId(),
            type: 'Paragraph',
            children: [{ text: '' }],
          },
        ],
      },
    };

    const newNote: Note = {
      id,
      title: '',
      content: initialContent,
      updatedAt: Date.now(),
      parentId, // Link to parent
    };
    setNotes(prev => [newNote, ...prev]);
    const updatedElement = {
      ...(element || {}),
      id: element?.id || generateId(),
      type: element?.type || 'sub-page',
      props: {
        ...(element?.props || {}),
        data: { id },
      },
    };
    editor.updateBlock(blockId, {
      value: [updatedElement],
    });
  }, [elementData, editor, blockId, element, setNotes, searchParams]);

  const title = linkedNote ? linkedNote.title || 'Untitled' : 'New page';

  return (
    <div
      className="my-1 py-1 px-1 rounded-md hover:bg-muted/50 cursor-pointer flex items-center gap-2 group select-none w-full"
      contentEditable={false}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (elementData.id) {
          router.push(`/notes?id=${elementData.id}`);
        }
      }}
      {...attributes}
    >
      <div className="flex items-center justify-center w-5 h-5">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-sm border-b border-muted-foreground/30 group-hover:border-muted-foreground/60 transition-colors text-foreground">
        {title}
      </span>
      {children}
    </div>
  );
};

export const SubPagePlugin = new YooptaPlugin({
  type: 'SubPage',
  elements: {
    'sub-page': {
      render: SubPageRender,
      props: {
        nodeType: 'void',
      },
    },
  },
  options: {
    display: {
      title: 'New Sub-page',
      description: 'Create a new page as a child of this one',
      icon: <FileText className="w-4 h-4" />,
    },
    shortcuts: ['#'],
  },
});

export default NoteLinkPlugin;
