'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/layout/app-provider';
import { ExcalidrawRoom, RoomStorage } from './storage';
import { useLevel } from '@/hooks/use-level';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Clock,
  LayoutGrid,
  FileJson,
  FileImage,
  ImageIcon,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  BarChart3,
  CalendarDays,
  Search,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { exportToBlob, exportToSvg, serializeAsJSON } from "@excalidraw/excalidraw";
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CollaborationDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLevel } = useLevel();
  const { rooms, setRooms } = useApp();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [roomType, setRoomType] = useState<'blank' | 'custom'>('blank');
  const [editingRoom, setEditingRoom] = useState<ExcalidrawRoom | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [rooms, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = rooms.length;
    const editedToday = rooms.filter(r => isToday(new Date(r.updatedAt))).length;
    const editedYesterday = rooms.filter(r => isYesterday(new Date(r.updatedAt))).length;
    return { total, editedToday, editedYesterday };
  }, [rooms]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    
    const roomId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newRoom: ExcalidrawRoom = {
      id: roomId,
      name: newRoomName,
      createdAt: now,
      updatedAt: now,
      elements: [],
      appState: { viewBackgroundColor: "#ffffff" },
      files: {}
    };

    // 1. Explicitly save to LocalStorage to ensure the Room Page can find it immediately
    RoomStorage.saveRoom(newRoom);
    
    // 2. Update React State
    setRooms(prev => [newRoom, ...prev]);
    setNewRoomName('');
    setIsCreateOpen(false);

    // 3. Sync to Supabase - we await this to ensure the record exists before the next page tries to fetch it
    const { error } = await supabase.from('boards').insert({
      id: roomId,
      name: newRoomName,
      elements: [],
      app_state: { viewBackgroundColor: "#ffffff", theme: "light" },
      created_at: now
    });

    if (error) {
      console.error("Failed to create board in Supabase:", error.message || error);
      toast({ title: "Sync failed", description: "Project created locally.", variant: "destructive" });
    }

    // 4. Navigate only after local storage is guaranteed to be updated
    router.push(`/collaboration/${newRoom.id}`);
  };

  const handleDeleteRoom = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingRoomId(id);
  };

  const confirmDeleteRoom = () => {
    if (!deletingRoomId) return;
    setRooms(prev => prev.filter(r => r.id !== deletingRoomId));
    setDeletingRoomId(null);
    toast({ title: "Canvas deleted" });
  };

  const handleRenameRoom = () => {
    if (!editingRoom || !newRoomName.trim()) return;
    const updated = { ...editingRoom, name: newRoomName, updatedAt: new Date().toISOString() };
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditingRoom(null);
    setNewRoomName('');
    toast({ title: "Canvas renamed" });
  };

  const handleDownload = async (room: ExcalidrawRoom, type: 'png' | 'svg' | 'json', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (type === 'json') {
        const json = serializeAsJSON(room.elements, room.appState, room.files || {}, "local");
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `${room.name}.excalidraw`);
        toast({ title: "Exported as JSON" });
      } 
      else if (type === 'png') {
        const blob = await exportToBlob({
          elements: room.elements,
          appState: {
            ...room.appState,
            exportWithDarkMode: room.appState?.theme === 'dark',
          },
          files: room.files || {},
          mimeType: "image/png",
        });
        if (blob) {
          downloadBlob(blob, `${room.name}.png`);
          toast({ title: "Exported as PNG" });
        }
      }
      else if (type === 'svg') {
        const svg = await exportToSvg({
          elements: room.elements,
          appState: {
            ...room.appState,
            exportWithDarkMode: room.appState?.theme === 'dark',
          },
          files: room.files || {},
        });
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        downloadBlob(blob, `${room.name}.svg`);
        toast({ title: "Exported as SVG" });
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const openRenameDialog = (room: ExcalidrawRoom, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRoom(room);
    setNewRoomName(room.name);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-full flex flex-col bg-background relative overflow-y-auto w-full">
        {/* Ambient background glow - Reduced blur for better performance */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[60px] -z-10 rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 blur-[40px] -z-10 rounded-full" />

        {/* Floating Toolbar */}
        <div className="sticky top-4 z-40 px-4 md:px-8 mb-4">
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-[1200px] mx-auto bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3"
            >
                <div className="flex items-center gap-3 pl-3 pr-4 border-r border-border/50">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <span className="font-bold tracking-tight hidden sm:inline">Collaboration</span>
                </div>

                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search canvases..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-muted/30 border-none pl-9 h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>

                <div className="hidden lg:flex items-center gap-4 px-4 text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{stats.total} Total</span>
                    </div>
                    {stats.editedToday > 0 && (
                        <div className="flex items-center gap-2 text-green-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{stats.editedToday} Today</span>
                        </div>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-10 rounded-xl gap-2 font-bold px-5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="w-4 h-4" />
                        New Canvas
                    </Button>
                </div>
            </motion.div>
        </div>

      <div className="flex-1 p-4 md:p-8 pt-2 max-w-[1400px] mx-auto w-full">
        {filteredRooms.length === 0 && searchQuery ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
            >
                <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6 border border-border/50">
                    <Filter className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold">No results found</h3>
                <p className="text-muted-foreground mt-2">No canvases match "{searchQuery}"</p>
                <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-4">
                    Clear search
                </Button>
            </motion.div>
        ) : filteredRooms.length === 0 ? (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
            >
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8 border border-primary/20 shadow-inner">
                    <LayoutGrid className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Your Canvas is empty</h3>
                <p className="text-muted-foreground mt-3 max-w-[300px] leading-relaxed">
                    Start a new collaboration room to begin brainstorming and building.
                </p>
                <Button 
                    size="lg" 
                    onClick={() => setIsCreateOpen(true)} 
                    className="mt-8 rounded-2xl h-14 px-8 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                    Create First Canvas
                </Button>
            </motion.div>
        ) : (
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >

                {filteredRooms.map((room) => (
                    <motion.div 
                        key={room.id}
                        variants={item}
                        whileHover={{ y: -5 }}
                        className="h-full"
                    >
                        <ContextMenu>
                        <ContextMenuTrigger>
                            <Card className="group h-full flex flex-col rounded-[2rem] overflow-hidden border-border/50 bg-card/40 backdrop-blur-md hover:bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 ring-1 ring-border/20 hover:ring-primary/20">
                            {/* Preview Area */}
                            <div 
                                className="relative h-40 bg-muted/20 cursor-pointer overflow-hidden"
                                onClick={() => router.push(`/collaboration/${room.id}`)}
                            >
                                {room.thumbnail ? (
                                    <img 
                                        src={room.thumbnail} 
                                        alt={room.name} 
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted/50 to-muted/10 relative">
                                        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#000_1px,transparent_1px)] dark:[background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                                        <LayoutGrid className="w-12 h-12 text-muted-foreground/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500" />
                                    </div>
                                )}
                                
                                {/* Status Chip */}
                                {isToday(new Date(room.updatedAt)) && (
                                    <div className="absolute top-4 left-4">
                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-none text-[10px] uppercase font-black tracking-widest px-2 py-0.5 shadow-sm">
                                            Recent
                                        </Badge>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-2xl">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 
                                            className="font-black text-lg tracking-tight truncate group-hover:text-primary transition-colors mb-1"
                                            onClick={() => router.push(`/collaboration/${room.id}`)}
                                        >
                                            {room.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <CalendarDays className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: true })}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 rounded-full hover:bg-muted/50">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-2xl border-border/50 backdrop-blur-xl">
                                            <DropdownMenuItem onClick={(e) => openRenameDialog(room, e)} className="rounded-lg">
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="opacity-50" />
                                            <DropdownMenuItem onClick={(e) => handleDownload(room, 'png', e)} className="rounded-lg">
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                Export as PNG
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleDownload(room, 'svg', e)} className="rounded-lg">
                                                <FileImage className="w-4 h-4 mr-2" />
                                                Export as SVG
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleDownload(room, 'json', e)} className="rounded-lg">
                                                <FileJson className="w-4 h-4 mr-2" />
                                                Export Config
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="opacity-50" />
                                            <DropdownMenuItem 
                                                className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" 
                                                onClick={(e) => handleDeleteRoom(room.id, e)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Permanent
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
                                    <div className="flex -space-x-1.5">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-muted text-[10px] flex items-center justify-center font-bold">
                                                ?
                                            </div>
                                        ))}
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                        onClick={() => router.push(`/collaboration/${room.id}`)}
                                    >
                                        Expand
                                    </Button>
                                </div>
                            </CardContent>
                            </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56 rounded-xl p-1 shadow-2xl backdrop-blur-xl border-border/50">
                            <ContextMenuItem onClick={(e) => openRenameDialog(room, e)} className="rounded-lg">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                            </ContextMenuItem>
                            <ContextMenuSeparator className="opacity-50" />
                            <ContextMenuItem onClick={(e) => handleDownload(room, 'png', e)} className="rounded-lg">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            PNG Export
                            </ContextMenuItem>
                            <ContextMenuItem onClick={(e) => handleDownload(room, 'svg', e)} className="rounded-lg">
                            <FileImage className="w-4 h-4 mr-2" />
                            SVG Export
                            </ContextMenuItem>
                            <ContextMenuSeparator className="opacity-50" />
                            <ContextMenuItem 
                            className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteRoom(room.id, e)}
                            >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                            </ContextMenuItem>
                        </ContextMenuContent>
                        </ContextMenu>
                    </motion.div>
                ))}
            </motion.div>
        )}
      </div>

      {/* Modern Dialogs */}
      <AnimatePresence>
        {isCreateOpen && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 border-border/40 bg-background/80 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.2)] dark:shadow-[0_0_100px_rgba(255,255,255,0.05)]">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black tracking-tight">Create Canvas</DialogTitle>
                    <p className="text-muted-foreground">Level up your brainstorming with a new workspace.</p>
                </DialogHeader>
                <div className="space-y-6 py-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest ml-1">Title</Label>
                        <Input 
                            placeholder="My Creative Session..." 
                            value={newRoomName} 
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                            className="h-14 rounded-2xl bg-muted/30 border-none text-lg px-5 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all font-medium"
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest ml-1">Template</Label>
                        <Select value={roomType} onValueChange={(v: any) => setRoomType(v)}>
                            <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none px-5 text-base focus:ring-1 focus:ring-primary/40">
                                <SelectValue placeholder="Begin with..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl p-1 border-border/50">
                                <SelectItem value="blank" className="rounded-xl h-12">
                                    <div className="flex items-center gap-3">
                                        <LayoutGrid className="h-4 w-4 text-primary" />
                                        <span className="font-semibold">Blank Canvas</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="custom" disabled={currentLevel < 60} className="rounded-xl h-12">
                                    <div className="flex items-center justify-between w-full min-w-[240px]">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="h-4 w-4 text-purple-500" />
                                            <span className="font-semibold">Advanced Suite</span>
                                        </div>
                                        {currentLevel < 60 ? (
                                            <Badge variant="secondary" className="rounded-full bg-muted text-[9px] font-black tracking-tighter">
                                                LOCKED LVL 60
                                            </Badge>
                                        ) : (
                                            <Badge className="rounded-full bg-green-500 text-[9px] font-black">UNLOCKED</Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="gap-3 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-2xl h-14 px-6 font-bold">Cancel</Button>
                    <Button 
                        onClick={handleCreateRoom}
                        disabled={!newRoomName.trim()}
                        className="rounded-2xl h-14 px-10 font-black text-lg shadow-xl shadow-primary/20"
                    >
                        Initialize
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </AnimatePresence>

      {/* Rename Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent className="rounded-[2.5rem] border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Rename Canvas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
              <Input 
                placeholder="New name..." 
                value={newRoomName} 
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameRoom()}
                className="h-14 rounded-2xl bg-muted/30 border-none px-5 text-lg"
              />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingRoom(null)} className="rounded-2xl h-12">Back</Button>
            <Button onClick={handleRenameRoom} className="rounded-2xl h-12 px-8 font-bold">Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRoomId} onOpenChange={(open) => !open && setDeletingRoomId(null)}>
        <DialogContent className="rounded-[2.5rem] border-border/40">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black text-destructive">Wipe Canvas</DialogTitle>
                <p className="py-4 text-muted-foreground font-medium">
                    Are you absolutely sure? This will permanently delete the canvas and all its contents. This cannot be recovered.
                </p>
            </DialogHeader>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setDeletingRoomId(null)} className="rounded-2xl h-12">Keep it</Button>
                <Button variant="destructive" onClick={confirmDeleteRoom} className="rounded-2xl h-12 px-8 font-bold">Confirm Wipe</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
