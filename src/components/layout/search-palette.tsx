
'use client';

import { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from '@/hooks/use-hotkeys-safe';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { CheckSquare, Notebook, Search, Users, ClipboardCheck, Landmark, Building, BookOpen, HeartPulse, Folder as FolderIcon, Globe } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useApp } from './app-provider';
import type { Task, Note, NetworkContact, Project, Client, Account, Asset, LearningResource, Activity, VaultFile } from '@/lib/types';
import { allNavItems } from '@/lib/nav-items';


interface CommandPaletteContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export const CommandPaletteProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export const useCommandPalette = () => {
    const context = useContext(CommandPaletteContext);
    if (!context) {
        throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
    }
    return context;
};


interface SearchableRoom {
    href: string;
    label: string;
    icon: React.ElementType;
    type: 'room';
}

interface SearchableWebSearch {
    href: string;
    label: string;
    icon: React.ElementType;
    type: 'web search';
}

interface SearchableNote extends Note {
    type: 'note';
    href: string;
    icon: React.ElementType;
}

interface SearchableTask extends Task {
    type: 'task';
    href: string;
    icon: React.ElementType;
}

interface SearchableContact extends NetworkContact {
    type: 'contact';
    href: string;
    icon: React.ElementType;
}

interface SearchableProject extends Project {
    type: 'project';
    href: string;
    icon: React.ElementType;
}

interface SearchableClient extends Client {
    type: 'client';
    href: string;
    icon: React.ElementType;
}

interface SearchableAccount extends Omit<Account, 'type'> {
    type: 'account';
    href: string;
    icon: React.ElementType;
}

interface SearchableAsset extends Asset {
    type: 'asset';
    href: string;
    icon: React.ElementType;
}

interface SearchableLearningResource extends Omit<LearningResource, 'type'> {
    type: 'learning resource';
    href: string;
    icon: React.ElementType;
}

interface SearchableActivity extends Activity {
    type: 'activity';
    href: string;
    icon: React.ElementType;
}

interface SearchableVaultFile extends VaultFile {
    type: 'file';
    href: string;
    icon: React.ElementType;
}

type SearchableItem = 
    | SearchableRoom 
    | SearchableWebSearch
    | SearchableNote 
    | SearchableTask 
    | SearchableContact
    | SearchableProject
    | SearchableClient
    | SearchableAccount
    | SearchableAsset
    | SearchableLearningResource
    | SearchableActivity
    | SearchableVaultFile;


export default function SearchPalette() {
    const { open, setOpen } = useCommandPalette();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();
    const { 
        notes, tasks, networkContacts, projects, clients, accounts, assets, learningResources, activities, vaultFiles,
        appSettings, isMac 
    } = useApp();
    const shortcut = appSettings.shortcuts.toggleSearch;
    const listRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);

    useHotkeys(
      shortcut.keys.join('+'),
      (e) => {
        if (e) e.preventDefault();
        setOpen(true);
      },
      { enableOnFormTags: false, enabled: shortcut.keys.length > 0 } as any
    );


    const allItems: SearchableItem[] = useMemo(() => {
        const navItems: SearchableRoom[] = allNavItems.flatMap(group => group.items).map(item => ({...item, type: 'room', icon: item.icon as React.ElementType}));

        const webSearchItem: SearchableWebSearch[] = searchTerm.trim() ? [{
            href: `/research?query=${encodeURIComponent(searchTerm)}`,
            label: `Search web for "${searchTerm}"`,
            icon: Globe,
            type: 'web search',
        }] : [];

        const notesForSearch: SearchableNote[] = Array.isArray(notes) ? notes.map(note => ({
            ...note,
            type: 'note' as const,
            href: `/notes?noteId=${note.id}`,
            icon: Notebook,
          })) : [];

        const tasksForSearch: SearchableTask[] = Array.isArray(tasks) ? tasks.map(task => ({
            ...task,
            id: task.id.toString(),
            label: task.name,
            type: 'task' as const,
            href: '/tasks',
            icon: CheckSquare,
          })) : [];

          const contactsForSearch: SearchableContact[] = Array.isArray(networkContacts) ? networkContacts.map(contact => ({
            ...contact,
            type: 'contact' as const,
            href: '/networking',
            icon: Users,
          })) : [];

          const projectsForSearch: SearchableProject[] = Array.isArray(projects) ? projects.map(p => ({
            ...p, type: 'project' as const, href: '/project-board', icon: ClipboardCheck
          })) : [];
        
          const clientsForSearch: SearchableClient[] = Array.isArray(clients) ? clients.map(c => ({
            ...c, type: 'client' as const, href: '/clients', icon: Users
          })) : [];

          const accountsForSearch: SearchableAccount[] = Array.isArray(accounts) ? accounts.map(a => ({
            ...a, type: 'account' as const, href: '/finance', icon: Landmark
          })) : [];
        
          const assetsForSearch: SearchableAsset[] = Array.isArray(assets) ? assets.map(a => ({
            ...a, type: 'asset' as const, href: '/asset-tracker', icon: Building
          })) : [];

          const learningForSearch: SearchableLearningResource[] = Array.isArray(learningResources) ? learningResources.map(l => ({
            ...l, type: 'learning resource' as const, href: '/learning', icon: BookOpen
          })) : [];

          const activitiesForSearch: SearchableActivity[] = Array.isArray(activities) ? activities.map(a => ({
            ...a, type: 'activity' as const, href: '/health', icon: HeartPulse
          })) : [];

          const vaultFilesForSearch: SearchableVaultFile[] = Array.isArray(vaultFiles) ? vaultFiles.map(f => ({
            ...f, type: 'file' as const, href: '/vilefault', icon: FolderIcon
          })) : [];


        return [
            ...webSearchItem,
            ...navItems, 
            ...notesForSearch, 
            ...tasksForSearch, 
            ...contactsForSearch,
            ...projectsForSearch,
            ...clientsForSearch,
            ...accountsForSearch,
            ...assetsForSearch,
            ...learningForSearch,
            ...activitiesForSearch,
            ...vaultFilesForSearch,
        ];
    }, [notes, tasks, networkContacts, projects, clients, accounts, assets, learningResources, activities, vaultFiles, searchTerm]);


    const filteredItems = useMemo(() => {
        if (!searchTerm) return allItems.filter(item => item.type === 'room');
        const lowerCaseSearch = searchTerm.toLowerCase();

        return allItems.filter(item => {
            if (item.type === 'web search') return true;

            const getLabel = (i: SearchableItem): string => {
                if ('title' in i && i.title) return i.title;
                if ('name' in i && i.name) return i.name;
                if ('label' in i && i.label) return i.label;
                return '';
            }

            const label = getLabel(item);
            let content = '';

            if ('content' in item && item.content) content = item.content;
            else if ('description' in item && item.description) content = item.description;
            else if ('notes' in item && item.notes) content = item.notes;
            else if ('company' in item && item.company) content = item.company;

            return label.toLowerCase().includes(lowerCaseSearch) ||
                   content.toLowerCase().includes(lowerCaseSearch)
        }
        );
    }, [searchTerm, allItems]);

    const groupedItems = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            let key: string;
            switch(item.type) {
                case 'web search': key = 'Web Search'; break;
                case 'room': key = 'Rooms'; break;
                case 'note': key = 'Notes'; break;
                case 'task': key = 'Tasks'; break;
                case 'contact': key = 'Contacts'; break;
                case 'project': key = 'Projects'; break;
                case 'client': key = 'Clients'; break;
                case 'account': key = 'Accounts'; break;
                case 'asset': key = 'Assets'; break;
                case 'learning resource': key = 'Learning'; break;
                case 'activity': key = 'Activities'; break;
                case 'file': key = 'Files'; break;
                default: key = 'Other';
            }

            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {} as Record<string, SearchableItem[]>);
    }, [filteredItems]);

    const flatItemList = useMemo(() => Object.values(groupedItems).flat(), [groupedItems]);
    
    useEffect(() => {
      setActiveIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const handleSelect = (href: string) => {
        router.push(href);
        setOpen(false);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % flatItemList.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + flatItemList.length) % flatItemList.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItemList[activeIndex]) {
                handleSelect(flatItemList[activeIndex].href);
            }
        }
    }
    
    // Reset state on close
    useEffect(() => {
        if(!open) {
            setSearchTerm('');
            setActiveIndex(0);
        }
    }, [open]);

  return (
    <>
        <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground h-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8"
            onClick={() => setOpen(true)}
        >
            <Search className="h-4 w-4 text-primary group-data-[collapsible=icon]:m-0 md:mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Search...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 group-data-[collapsible=icon]:hidden sm:flex">
                <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>
                {shortcut.keys.find(k => k !== 'mod')?.toUpperCase()}
            </kbd>
        </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
            className="p-0 gap-0 max-w-2xl overflow-hidden" 
            onKeyDown={handleKeyDown}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search through all your rooms, notes, tasks, and more.</DialogDescription>
          </DialogHeader>
            <div className='flex items-center border-b px-5'>
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search rooms, notes, tasks, or the web…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 h-14 text-base bg-transparent placeholder:text-muted-foreground/80"
                    autoFocus
                />
            </div>
            <ScrollArea className="h-[50vh]">
                <div className="p-4 space-y-2" ref={listRef}>
                    {Object.keys(groupedItems).length > 0 ? (
                    Object.entries(groupedItems).map(([group, items]) => (
                        <div key={group} className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3 py-1.5">{group}</p>
                            <div className="space-y-1">
                                {items.map((item) => {
                                    const globalIndex = flatItemList.findIndex(i => ('id' in i && 'id' in item) ? i.id === item.id && i.type === item.type : i.href === item.href && i.type === item.type);
                                    const isActive = globalIndex === activeIndex;

                                    const getDisplayTitle = (i: SearchableItem): string => {
                                        if ('title' in i && i.title) return i.title;
                                        if ('name' in i && i.name) return i.name;
                                        if ('label' in i && i.label) return i.label;
                                        return 'Untitled';
                                    }
                                    const getDisplayContent = (i: SearchableItem) => {
                                        if (i.type === 'web search') return i.href;
                                        if ('content' in i && i.content) return i.content.replace(/^#.*?\n\n/, '');
                                        if ('description' in i && i.description) return i.description;
                                        if ('notes' in i && i.notes) return i.notes;
                                        if ('company' in i && i.company) return i.company;
                                        return null;
                                    }
                                    
                                    const title = getDisplayTitle(item);
                                    const content = getDisplayContent(item);
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={`${item.type}-${'id' in item ? item.id : item.href}`}
                                            onClick={() => handleSelect(item.href)}
                                            onMouseMove={() => setActiveIndex(globalIndex)}
                                            ref={isActive ? activeItemRef : null}
                                            className={cn(
                                                "flex items-center justify-between gap-3 p-3 rounded-md transition-colors cursor-pointer group border-l-2", 
                                                isActive ? 'bg-secondary border-primary' : 'border-transparent hover:bg-secondary'
                                            )}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <Icon className={cn("h-5 w-5 text-muted-foreground flex-shrink-0", item.type === 'task' && 'completed' in item && item.completed && "text-green-500")} />
                                                <div className="flex flex-col overflow-hidden">
                                                        <span className={cn("text-sm font-medium text-foreground truncate", item.type === 'task' && 'completed' in item && item.completed && "line-through text-muted-foreground")}>
                                                            {title}
                                                        </span>
                                                        {content && (
                                                            <span className="text-xs text-muted-foreground truncate">{content}</span>
                                                        )}
                                                </div>
                                            </div>
                                            <div className="text-xs uppercase font-semibold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">{item.type}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                    ) : (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            <p>No results found for "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
             <div className="p-3 border-t text-center">
                <p className="text-xs text-muted-foreground">
                    Use <kbd className="font-mono bg-secondary text-muted-foreground p-1 rounded-sm">↑</kbd> <kbd className="font-mono bg-secondary text-muted-foreground p-1 rounded-sm">↓</kbd> to navigate, <kbd className="font-mono bg-secondary text-muted-foreground p-1 rounded-sm">Enter</kbd> to select.
                </p>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
