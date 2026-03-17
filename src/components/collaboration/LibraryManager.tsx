import { useState, useEffect } from 'react';
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Library, Download, Trash2, Upload, Check, Loader2, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export interface LibraryItem {
  id: string;
  status: string;
  created: number;
  elements: any[];
}

interface ExternalLibrary {
  name: string;
  description: string;
  source: string;
  preview: string;
  date: string;
  author: string;
}

interface InstalledPack {
  id: string;
  name: string;
  items: LibraryItem[];
  isCustom?: boolean;
}

interface LibraryManagerProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  onLibraryChangeRequest?: (items: LibraryItem[]) => void;
  currentItems?: LibraryItem[];
}

export function LibraryManager({ excalidrawAPI, onLibraryChangeRequest, currentItems = [] }: LibraryManagerProps) {
  const [externalLibs, setExternalLibs] = useState<ExternalLibrary[]>([]);
  const [installedPacks, setInstalledPacks] = useState<InstalledPack[]>([]);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Load installed packs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('excalidraw-installed-packs');
    if (saved) {
      try {
        setInstalledPacks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load installed packs", e);
      }
    }

    // Fetch available libraries
    fetch('https://libraries.excalidraw.com/libraries.json')
      .then(res => res.json())
      .then(data => setExternalLibs(data))
      .catch(err => console.error("Failed to fetch libraries", err))
      .finally(() => setIsListLoading(false));
  }, []);

  // Save packs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('excalidraw-installed-packs', JSON.stringify(installedPacks));
  }, [installedPacks]);

  // Sync with Excalidraw when API is ready or packs change
  useEffect(() => {
    if (excalidrawAPI) {
        updateExcalidrawLibrary();
    }
  }, [excalidrawAPI, installedPacks]); // currentItems removed from deps to avoid loop if not handled carefully

  const updateExcalidrawLibrary = async () => {
    if (!excalidrawAPI) return;

    const packItems = installedPacks.flatMap(p => p.items);
    // Use passed currentItems instead of calling API
    // However, if currentItems contains items from installedPacks (due to onLibraryChange feedback),
    // we need to be careful not to duplicate endlessly.
    // Ideally, currentItems should be the "base" library + manual additions.
    // But Excalidraw just gives us "everything".
    
    // Strategy: We rely on installedPacks as the source of truth for "Installed" stuff.
    // We treat currentItems as "potentially having manual stuff".
    
    // Actually, simply merging and deduping by ID is robust enough.
    const allItems = [...currentItems, ...packItems];
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

    excalidrawAPI.updateLibrary({
      libraryItems: uniqueItems
    });
  };

  const installLibrary = async (lib: ExternalLibrary) => {
    if (installingId) return; // Prevent multiple installs at once
    setInstallingId(lib.name);
    
    try {
      // Check if already installed
      if (installedPacks.some(p => p.name === lib.name)) {
        toast({ title: "Already installed" });
        setInstallingId(null);
        return;
      }

      // Use proxy to avoid CORS issues
      const res = await fetch(`/api/collaboration/proxy-library?url=${encodeURIComponent(lib.source)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      
      let items: LibraryItem[] = [];
      if (data.libraryItems) {
        items = data.libraryItems;
      } else if (Array.isArray(data)) {
        items = data;
      }

      // Add unique IDs if missing (some old libs might lack them)
      items = items.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        status: "published",
        created: Date.now()
      }));

      const newPack: InstalledPack = {
        id: crypto.randomUUID(),
        name: lib.name,
        items: items
      };

      // Update State
      const newPacks = [...installedPacks, newPack];
      setInstalledPacks(newPacks);

      // Update Excalidraw
      if (excalidrawAPI) {
        // Merge: Excalidraw `updateLibrary` replaces the whole list.
        // We want Current + New.
        const allItems = [...currentItems, ...items];
        const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
        
        excalidrawAPI.updateLibrary({
          libraryItems: uniqueItems
        });
      }

      toast({ title: `Installed ${lib.name}` });
    } catch (e) {
      console.error(e);
      toast({ title: `Failed to install ${lib.name}`, description: "Please check your internet connection.", variant: "destructive" });
    } finally {
      setInstallingId(null);
    }
  };

  const removePack = (pack: InstalledPack) => {
    // Remove from state
    setInstalledPacks(prev => prev.filter(p => p.id !== pack.id));

    // Remove from Excalidraw
    if (excalidrawAPI) {
      const packItemIds = new Set(pack.items.map(i => i.id));
      const filtered = currentItems.filter(i => !packItemIds.has(i.id));
      
      excalidrawAPI.updateLibrary({
        libraryItems: filtered
      });
      toast({ title: `Removed ${pack.name}` });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = ev.target?.result as string;
        const data = JSON.parse(content);
        
        let items: LibraryItem[] = [];
        if (data.libraryItems) items = data.libraryItems;
        else if (Array.isArray(data)) items = data;

         // Ensure IDs
         items = items.map(item => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            status: "published",
            created: Date.now()
          }));

        const newPack: InstalledPack = {
          id: crypto.randomUUID(),
          name: file.name.replace('.excalidrawlib', '').replace('.json', ''),
          items: items,
          isCustom: true
        };

        setInstalledPacks(prev => [...prev, newPack]);

        if (excalidrawAPI) {
            const allItems = [...currentItems, ...items];
            const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
            
            excalidrawAPI.updateLibrary({
                libraryItems: uniqueItems
            });
        }
        
        toast({ title: "Custom library added" });
      } catch (err) {
        toast({ title: "Invalid file format", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const filteredLibs = externalLibs.filter(lib => 
    lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lib.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Library">
          <Library className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Library Manager</SheetTitle>
          <SheetDescription>
            Manage your Excalidraw libraries. Installed libraries are available in the editor.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="browse" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="custom">Upload</TabsTrigger>
          </TabsList>

          {/* BROWSE TAB */}
          <TabsContent value="browse" className="h-[calc(100vh-200px)]">
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search libraries..." 
                        className="pl-8"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 gap-4">
                {isListLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    filteredLibs.map((lib, idx) => {
                        const isInstalled = installedPacks.some(p => p.name === lib.name);
                        const isInstalling = installingId === lib.name;
                        return (
                            <div key={idx} className="flex gap-4 p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                                    {lib.preview ? (
                                        <img 
                                            src={lib.preview} 
                                            alt={lib.name} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }} 
                                        />
                                    ) : null}
                                    <div className={`w-full h-full flex items-center justify-center ${lib.preview ? 'hidden' : ''}`}>
                                        <Library className="w-8 h-8 text-zinc-400" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{lib.name}</h4>
                                    <p className="text-sm text-zinc-500 line-clamp-2">{lib.description}</p>
                                    <div className="mt-2 flex items-center gap-2 h-9">
                                        {isInstalled ? (
                                            <Badge variant="secondary" className="gap-1">
                                                <Check className="w-3 h-3" /> Installed
                                            </Badge>
                                        ) : isInstalling ? (
                                            <div className="flex flex-col gap-1 w-32">
                                                <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 animate-pulse rounded-full" style={{ width: '100%' }} />
                                                </div>
                                                <span className="text-[10px] text-zinc-500">Installing...</span>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => installLibrary(lib)} disabled={installingId !== null}>
                                                <Download className="w-4 h-4 mr-2" />
                                                Install
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* INSTALLED TAB */}
          <TabsContent value="installed" className="h-[calc(100vh-200px)]">
            <ScrollArea className="h-full pr-4">
               {installedPacks.length === 0 ? (
                   <div className="text-center text-zinc-500 mt-10">No libraries installed.</div>
               ) : (
                   <div className="flex flex-col gap-3">
                       {installedPacks.map(pack => (
                           <div key={pack.id} className="flex items-center justify-between p-3 border rounded-lg">
                               <div className="flex items-center gap-3">
                                   <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
                                       <Library className="w-4 h-4" />
                                   </div>
                                   <div>
                                       <div className="font-medium">{pack.name}</div>
                                       <div className="text-xs text-zinc-500">{pack.items.length} items • {pack.isCustom ? 'Custom' : 'Official'}</div>
                                   </div>
                               </div>
                               <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removePack(pack)}>
                                   <Trash2 className="w-4 h-4" />
                               </Button>
                           </div>
                       ))}
                   </div>
               )}
            </ScrollArea>
          </TabsContent>

          {/* UPLOAD TAB */}
          <TabsContent value="custom">
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <Upload className="w-10 h-10 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Library</h3>
                <p className="text-sm text-zinc-500 mb-4 text-center max-w-xs">
                    Select a .excalidrawlib or .json file to add to your library.
                </p>
                <div className="relative">
                    <Button>Choose File</Button>
                    <Input 
                        type="file" 
                        accept=".json,.excalidrawlib"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                    />
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
