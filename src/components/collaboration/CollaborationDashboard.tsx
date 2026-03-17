'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/layout/app-provider';
import { RoomStorage, ExcalidrawRoom } from './storage';
import { useLevel } from '@/hooks/use-level';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock,
  LayoutGrid,
  Download,
  FileJson,
  FileImage,
  ImageIcon,
  Lock,
  Unlock,
  ExternalLink,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { exportToBlob, exportToSvg, serializeAsJSON } from "@excalidraw/excalidraw";
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/utils';

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

    const { error } = await supabase.from('boards').insert({
      id: roomId,
      name: newRoomName,
      elements: [],
      app_state: { viewBackgroundColor: "#ffffff", theme: "light" },
      created_at: now
    });

    if (error) {
      console.error("Failed to create board in Supabase:", error);
    }

    setRooms(prev => [newRoom, ...prev]);
    setNewRoomName('');
    setIsCreateOpen(false);
    router.push(`/collaboration/${newRoom.id}`);
  };

  const handleDeleteRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingRoomId(id);
  };

  const confirmDeleteRoom = () => {
    if (!deletingRoomId) return;
    setRooms(prev => prev.filter(r => r.id !== deletingRoomId));
    setDeletingRoomId(null);
  };

  const handleRenameRoom = () => {
    if (!editingRoom || !newRoomName.trim()) return;
    const updated = { ...editingRoom, name: newRoomName, updatedAt: new Date().toISOString() };
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditingRoom(null);
    setNewRoomName('');
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
      toast({ title: "Export failed", description: "Could not generate file", variant: "destructive" });
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

  const openRenameDialog = (room: ExcalidrawRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoom(room);
    setNewRoomName(room.name);
  };

  return (
    <div className="min-h-full bg-background/50">
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Card */}
          <div 
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 p-6 hover:bg-muted/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center h-[280px]" 
              onClick={() => setIsCreateOpen(true)}
          >
              <div className="w-16 h-16 rounded-full bg-background shadow-sm border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                  <Plus className="w-8 h-8 text-primary/80" />
              </div>
              <p className="font-semibold text-xl text-foreground/80">New Canvas</p>
              <p className="text-sm text-muted-foreground mt-1">Start from scratch</p>
          </div>

          {rooms.map((room) => (
            <ContextMenu key={room.id}>
              <ContextMenuTrigger>
                <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-[280px] flex flex-col bg-card/50 backdrop-blur-sm hover:bg-card ring-1 ring-border/50 hover:ring-primary/20">
                  {/* Preview Area */}
                  <div 
                      className="relative h-44 bg-muted/30 cursor-pointer overflow-hidden group-hover:opacity-100 transition-opacity"
                      onClick={() => router.push(`/collaboration/${room.id}`)}
                  >
                      {room.thumbnail ? (
                          <img 
                              src={room.thumbnail} 
                              alt={room.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                      ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-50">
                              <LayoutGrid className="w-12 h-12 opacity-20" />
                          </div>
                      )}
                      
                      {/* Hover Overlay with Action */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <Button variant="secondary" className="shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none font-medium">
                            Open Canvas
                          </Button>
                      </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                          <h3 
                              className="font-bold text-lg leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={() => router.push(`/collaboration/${room.id}`)}
                              title={room.name}
                          >
                              {room.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: true })}
                          </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => openRenameDialog(room, e)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          
                          <div className="h-px bg-border my-1" />
                          
                          <DropdownMenuItem onClick={(e) => handleDownload(room, 'png', e)}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Download as PNG
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDownload(room, 'svg', e)}>
                            <FileImage className="w-4 h-4 mr-2" />
                            Download as SVG
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDownload(room, 'json', e)}>
                            <FileJson className="w-4 h-4 mr-2" />
                            Download as JSON
                          </DropdownMenuItem>

                          <div className="h-px bg-border my-1" />

                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={(e) => handleDeleteRoom(room.id, e)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={(e) => openRenameDialog(room, e)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </ContextMenuItem>
                
                <ContextMenuSeparator />
                
                <ContextMenuItem onClick={(e) => handleDownload(room, 'png', e)}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Download as PNG
                </ContextMenuItem>
                <ContextMenuItem onClick={(e) => handleDownload(room, 'svg', e)}>
                  <FileImage className="w-4 h-4 mr-2" />
                  Download as SVG
                </ContextMenuItem>
                <ContextMenuItem onClick={(e) => handleDownload(room, 'json', e)}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Download as JSON
                </ContextMenuItem>
                
                <ContextMenuSeparator />
                
                <ContextMenuItem 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                  onClick={(e) => handleDeleteRoom(room.id, e)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                  <Label>Canvas Name</Label>
                  <Input 
                    placeholder="e.g. Brainstorming Session" 
                    value={newRoomName} 
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  />
              </div>
              
              <div className="space-y-2">
                  <Label>Canvas Type</Label>
                  <Select value={roomType} onValueChange={(v: any) => setRoomType(v)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="blank">
                              <div className="flex items-center gap-2">
                                  <LayoutGrid className="h-4 w-4" />
                                  <span>Blank Canvas</span>
                              </div>
                          </SelectItem>
                          <SelectItem value="custom" disabled={currentLevel < 60}>
                              <div className="flex items-center justify-between w-full min-w-[200px]">
                                  <div className="flex items-center gap-2">
                                      <ImageIcon className="h-4 w-4" />
                                      <span>Custom Room</span>
                                  </div>
                                  {currentLevel < 60 ? (
                                      <Badge variant="secondary" className="ml-2 text-[10px] flex items-center gap-1">
                                          <Lock className="h-3 w-3" /> Lvl 60
                                      </Badge>
                                  ) : (
                                       <Badge variant="default" className="ml-2 text-[10px] flex items-center gap-1 bg-green-500 hover:bg-green-600">
                                          <Unlock className="h-3 w-3" /> Unlocked
                                      </Badge>
                                  )}
                              </div>
                          </SelectItem>
                      </SelectContent>
                  </Select>
                  {roomType === 'custom' && (
                      <p className="text-xs text-muted-foreground">
                          Custom rooms include advanced templates and pre-configured workspaces.
                      </p>
                  )}
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRoom}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Canvas</DialogTitle>
          </DialogHeader>
          <Input 
            placeholder="Canvas Name" 
            value={newRoomName} 
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameRoom()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>Cancel</Button>
            <Button onClick={handleRenameRoom}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRoomId} onOpenChange={(open) => !open && setDeletingRoomId(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Canvas</DialogTitle>
                <div className="py-2 text-muted-foreground">
                    Are you sure you want to delete this canvas? This action cannot be undone.
                </div>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeletingRoomId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDeleteRoom}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
