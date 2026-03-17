'use client';

import { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from '@/hooks/use-hotkeys-safe';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Search, Folder as FolderIcon, ArrowRight, Command } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useApp } from './app-provider';
import type { Task, Note, NetworkContact, Project, Client, Account, Asset, LearningResource, Activity, VaultFile } from '@/lib/types';
import { allNavItems, iconMap } from '@/lib/nav-items';
import Logo from '@/components/logo';

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

interface SearchableTask extends Task {
    type: 'task';
    href: string;
    icon: React.ElementType;
}

interface SearchableContact extends Omit<NetworkContact, 'icon'> {
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

interface SearchableLearningResource extends Omit<LearningResource, 'type' | 'icon'> {
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
    | SearchableTask 
    | SearchableContact  | SearchableProject
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
    
    // We use a ref map to store references to all list items
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useHotkeys(
      shortcut.keys.join('+'),
      (e) => {
        if (e) e.preventDefault();
        setOpen(true);
      },
      { enableOnFormTags: false, enabled: shortcut.keys.length > 0 } as any
    );

    const allItems: SearchableItem[] = useMemo(() => {
        const navItems: SearchableRoom[] = allNavItems
          .flatMap(group => group.items)
          .map(item => {
            // Special handling for AI Room to use App Logo
            if (item.href === '/ai-room') {
                return {
                    href: item.href,
                    label: item.label, // Should be 'Alfred' from nav-items
                    type: 'room' as const,
                    icon: (props: any) => <Logo {...props} />,
                };
            }
            const Icon = iconMap[item.icon] || FolderIcon;
            return {
              href: item.href,
              label: item.label,
              type: 'room' as const,
              icon: Icon,
            };
          });

        const tasksForSearch: SearchableTask[] = Array.isArray(tasks) ? tasks.map(task => ({
            ...task,
            id: task.id.toString(),
            label: task.name,
            type: 'task' as const,
            href: '/tasks',
            icon: iconMap['ListTodo'] || FolderIcon,
          })) : [];

          const contactsForSearch: SearchableContact[] = Array.isArray(networkContacts) ? networkContacts.map(contact => ({
            ...contact,
            type: 'contact' as const,
            href: '/networking',
            icon: iconMap['Network'] || FolderIcon,
          })) : [];
    
          const projectsForSearch: SearchableProject[] = Array.isArray(projects) ? projects.map(p => ({
            ...p, type: 'project' as const, href: '/project-board', icon: iconMap['KanbanSquare'] || FolderIcon
          })) : [];
        
          const clientsForSearch: SearchableClient[] = Array.isArray(clients) ? clients.map(c => ({
            ...c, type: 'client' as const, href: '/clients', icon: iconMap['Users'] || FolderIcon
          })) : [];
    
          const accountsForSearch: SearchableAccount[] = Array.isArray(accounts) ? accounts.map(a => ({
            ...a, type: 'account' as const, href: '/finance', icon: iconMap['Wallet'] || FolderIcon
          })) : [];
        
          const assetsForSearch: SearchableAsset[] = Array.isArray(assets) ? assets.map(a => ({
            ...a, type: 'asset' as const, href: '/asset-tracker', icon: iconMap['Building'] || FolderIcon
          })) : [];
    
          const learningForSearch: SearchableLearningResource[] = Array.isArray(learningResources) ? learningResources.map(l => ({
            ...l, type: 'learning resource' as const, href: '/learning', icon: iconMap['GraduationCap'] || FolderIcon
          })) : [];
    
          const activitiesForSearch: SearchableActivity[] = Array.isArray(activities) ? activities.map(a => ({
            ...a, type: 'activity' as const, href: '/health', icon: iconMap['Activity'] || FolderIcon
          })) : [];
    
          const vaultFilesForSearch: SearchableVaultFile[] = Array.isArray(vaultFiles) ? vaultFiles.map(f => ({
            ...f, type: 'file' as const, href: '/file-vault', icon: iconMap['Lock'] || FolderIcon
          })) : [];

          const includeTasks = appSettings.commandPalette?.includeTasks ?? true;
          const includeContacts = appSettings.commandPalette?.includeContacts ?? true;
          const includeProjects = appSettings.commandPalette?.includeProjects ?? true;

        return [
            ...navItems, 
            ...(includeTasks ? tasksForSearch : []), 
            ...(includeContacts ? contactsForSearch : []),
            ...(includeProjects ? projectsForSearch : []),
            ...clientsForSearch,
            ...accountsForSearch,
            ...assetsForSearch,
            ...learningForSearch,
            ...activitiesForSearch,
            ...vaultFilesForSearch,
        ];
    }, [notes, tasks, networkContacts, projects, clients, accounts, assets, learningResources, activities, vaultFiles, appSettings.commandPalette]);


    const filteredItems = useMemo(() => {
        if (!searchTerm) return allItems.filter(item => item.type === 'room'); // Default view
        const lowerCaseSearch = searchTerm.toLowerCase();

        return allItems.filter(item => {
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
            else if ('company' in item && item.company) content = item.company;

            return label.toLowerCase().includes(lowerCaseSearch) ||
                   content.toLowerCase().includes(lowerCaseSearch)
        });
    }, [searchTerm, allItems]);

    // Group items for display
    const groupedItems = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            let key: string;
            switch(item.type) {
                case 'room': key = 'Navigation'; break;
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
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {} as Record<string, SearchableItem[]>);
    }, [filteredItems]);

    // Flatten for keyboard navigation
    const flatItemList = useMemo(() => {
         // Sort groups so Navigation comes first
         const order = ['Navigation', 'Projects', 'Tasks', 'Files', 'Contacts', 'Clients', 'Accounts', 'Assets', 'Learning', 'Activities', 'Other'];
         const sortedKeys = Object.keys(groupedItems).sort((a, b) => {
             const indexA = order.indexOf(a);
             const indexB = order.indexOf(b);
             return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
         });
         
         return sortedKeys.flatMap(key => groupedItems[key]);
    }, [groupedItems]);
    
    // Reset active index when search changes
    useEffect(() => {
      setActiveIndex(0);
    }, [searchTerm]);

    // Handle Scroll - The "Premium" feel fix
    useEffect(() => {
        const activeElement = itemRefs.current[activeIndex];
        if (activeElement) {
            // scrollIntoView with block: 'nearest' ensures it doesn't jump unnecessarily
            // Use auto behavior for instant scrolling when spamming keys
            activeElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
    }, [activeIndex, flatItemList]);

    const handleSelect = (href: string) => {
        setOpen(false);
        if (href.startsWith('http')) {
            window.open(href, '_blank');
        } else {
            router.push(href);
        }
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
    };
    
    // Reset state on close
    useEffect(() => {
        if(!open) {
            setTimeout(() => setSearchTerm(''), 200); // Delay clearing to avoid flash
            setActiveIndex(0);
        }
    }, [open]);

  return (
    <>
        <Button
            variant="outline"
            className="w-full justify-between text-muted-foreground h-9 px-3 shadow-none bg-muted/50 hover:bg-muted/80 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:p-0"
            onClick={() => setOpen(true)}
        >
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 opacity-50" />
                <span className="group-data-[collapsible=icon]:hidden text-sm">Search...</span>
            </div>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 group-data-[collapsible=icon]:hidden sm:flex shadow-sm">
                <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>
                {shortcut.keys.find(k => k !== 'mod')?.toUpperCase() || 'K'}
            </kbd>
        </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
            className="p-0 gap-0 max-w-3xl overflow-hidden border-none shadow-2xl bg-popover/95 backdrop-blur-xl ring-1 ring-white/10" 
            onKeyDown={handleKeyDown}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Command Palette</DialogTitle>
            <DialogDescription>Search through your workspace</DialogDescription>
          </DialogHeader>
            
            <div className='flex items-center border-b border-white/5 px-4 py-1'>
                <Search className="h-5 w-5 text-muted-foreground/50 mr-3" />
                <Input
                    placeholder="What do you need?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 h-14 text-lg bg-transparent placeholder:text-muted-foreground/50 px-0"
                    autoFocus
                />
                <div className="flex items-center gap-2">
                </div>
            </div>

            <ScrollArea className="h-[60vh] sm:h-[550px]">
                <div className="p-2">
                    {flatItemList.length > 0 ? (
                         // We iterate by groups to render headers, but we need to map flatItemList to indices
                         // Actually, standard rendering is fine.
                         // Let's use the grouped structure for rendering headers
                        Object.entries(groupedItems).map(([group, items]) => {
                             if (items.length === 0) return null;
                             return (
                                <div key={group} className="mb-4">
                                    {group !== 'Navigation' && (
                                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider sticky top-0 bg-popover/95 backdrop-blur-xl z-10">
                                            {group}
                                        </div>
                                    )}
                                    <div className="space-y-0.5">
                                        {items.map((item) => {
                                            // Find the global index for this item to match activeIndex
                                            // Note: flatItemList is sorted by group order, so we can just find it
                                            const globalIndex = flatItemList.indexOf(item);
                                            const isActive = globalIndex === activeIndex;
                                            
                                            const getDisplayTitle = (i: SearchableItem): string => {
                                                if ('title' in i && i.title) return i.title;
                                                if ('name' in i && i.name) return i.name;
                                                if ('label' in i && i.label) return i.label;
                                                return 'Untitled';
                                            }
                                            const getDisplayContent = (i: SearchableItem) => {
                                                if ('content' in i && i.content) return i.content.replace(/^#.*?\n\n/, '');
                                                if ('description' in i && i.description) return i.description;
                                                if ('company' in i && i.company) return i.company;
                                                return null;
                                            }
                                            
                                            const title = getDisplayTitle(item);
                                            const content = getDisplayContent(item);
                                            const Icon = item.icon;

                                            return (
                                                <div
                                                    key={`${item.type}-${'id' in item ? item.id : item.href}`}
                                                    ref={el => { itemRefs.current[globalIndex] = el; }}
                                                    onClick={() => {
                                                        if (item.href.startsWith('http')) {
                                                            window.open(item.href, '_blank');
                                                            setOpen(false);
                                                        } else {
                                                            handleSelect(item.href);
                                                        }
                                                    }}
                                                    onMouseMove={(e) => {
                                                        // Prevent mouse hover from hijacking selection during keyboard navigation
                                                        if (e.movementX !== 0 || e.movementY !== 0) {
                                                            setActiveIndex(globalIndex);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer group relative scroll-mt-10", 
                                                        isActive ? 'bg-accent/50 text-accent-foreground' : 'text-muted-foreground hover:bg-accent/30'
                                                    )}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="active-indicator"
                                                            className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        />
                                                    )}

                                                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                                                        <div className={cn("p-2 rounded-md transition-colors", isActive ? "bg-background shadow-sm" : "bg-muted/30")}>
                                                            <Icon className={cn("h-5 w-5", item.type === 'task' && 'completed' in item && item.completed && "text-green-500")} />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                                <span className={cn("text-sm font-medium truncate transition-colors", isActive ? "text-foreground" : "")}>
                                                                    {title}
                                                                </span>
                                                                {content && (
                                                                    <span className="text-xs text-muted-foreground/70 truncate max-w-[400px]">{content}</span>
                                                                )}
                                                        </div>
                                                    </div>
                                                    
                                                    {isActive && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-200">
                                                            <span className="hidden sm:inline">Jump to</span>
                                                            <ArrowRight className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                             )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Command className="h-10 w-10 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No results found</p>
                            <p className="text-sm opacity-60">Try searching for something else</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            <div className="bg-muted/30 border-t border-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                <div className="flex gap-4">
                     <span className="flex items-center gap-1">
                        <kbd className="bg-background/50 border border-white/10 rounded px-1 min-w-[16px] text-center">↑</kbd>
                        <kbd className="bg-background/50 border border-white/10 rounded px-1 min-w-[16px] text-center">↓</kbd>
                        <span>to navigate</span>
                     </span>
                     <span className="flex items-center gap-1">
                        <kbd className="bg-background/50 border border-white/10 rounded px-1 min-w-[20px] text-center">↵</kbd>
                        <span>to select</span>
                     </span>
                </div>
                <div>
                     <span className="flex items-center gap-1">
                        <span className="opacity-70">Pro Tip:</span>
                        <span>Type </span>
                        <kbd className="bg-background/50 border border-white/10 rounded px-1">@</kbd>
                        <span> to filter</span>
                     </span>
                </div>
            </div>

        </DialogContent>
      </Dialog>
    </>
  );
}