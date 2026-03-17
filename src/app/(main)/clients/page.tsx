
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Users, UserCheck, Trash2, X, ExternalLink, Copy, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client, ClientStatus } from '@/lib/types';
import AddClientDialog from '@/components/clients/add-client-dialog';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '@/components/layout/app-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const statusConfig: Record<Client['status'], { label: string; color: string }> = {
    'lead': { label: 'Lead', color: 'bg-yellow-500' },
    'active': { label: 'Active', color: 'bg-green-500' },
    'inactive': { label: 'Inactive', color: 'bg-gray-500' },
};


export default function ClientsPage() {
  const { clients, setClients } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);


  // Mouse Selection Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="menuitem"], [data-selectable]')) return;

    if (!e.shiftKey && !e.ctrlKey) {
      setSelectedIds([]);
    }

    e.preventDefault(); // Prevent text selection and scroll jumping

    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isSelecting: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox?.isSelecting) return;

    setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

    const selectionRect = {
      left: Math.min(selectionBox.startX, e.clientX),
      top: Math.min(selectionBox.startY, e.clientY),
      right: Math.max(selectionBox.startX, e.clientX),
      bottom: Math.max(selectionBox.startY, e.clientY),
    };

    const selectableElements = document.querySelectorAll('[data-selectable="true"]');
    const newSelectedIds = new Set(e.shiftKey || e.ctrlKey ? selectedIds : []);

    selectableElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const id = el.getAttribute('data-id');
      
      if (id && 
          rect.left < selectionRect.right &&
          rect.right > selectionRect.left &&
          rect.top < selectionRect.bottom &&
          rect.bottom > selectionRect.top) {
        newSelectedIds.add(id);
      }
    });

    setSelectedIds(Array.from(newSelectedIds));
  };

  const handleMouseUp = () => {
    if (selectionBox?.isSelecting) {
      setSelectionBox(null);
    }
  };

  const handleToggleSelection = (clientId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedIds.length > 0) {
        e.stopPropagation();
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const allIds = clients.map(c => c.id);
      const startIdx = allIds.indexOf(lastSelectedId);
      const endIdx = allIds.indexOf(clientId);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const start = Math.min(startIdx, endIdx);
        const end = Math.max(startIdx, endIdx);
        const rangeIds = allIds.slice(start, end + 1);
        
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return Array.from(newSet);
        });
      }
    } else if (e.ctrlKey) {
        e.stopPropagation();
      setSelectedIds(prev => 
        prev.includes(clientId) 
          ? prev.filter(id => id !== clientId)
          : [...prev, clientId]
      );
    } else {
        // If simply clicking, we might want to view details, but for now just select
      // Or if it's a row click, maybe we don't want to select unless shift/ctrl is held?
      // But the existing code has onClick with handleToggleSelection.
      // Usually simple click selects only that item.
      if (selectedIds.length > 0) {
          setSelectedIds([]);
      }
      // If we want row click to open edit dialog, we should probably check if not selecting.
      // But here we'll just toggle selection.
      // Actually, standard behavior is simple click selects the item and deselects others.
      setSelectedIds([clientId]);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleAddClient = (newClient: Omit<Client, 'id'>) => {
    const clientToAdd: Client = {
      ...newClient,
      id: `client-${Date.now()}`,
    };
    setClients(prev => [clientToAdd, ...prev]);
  };
  
  const handleEditClient = (updatedClient: Omit<Client, 'id'>) => {
    if(!clientToEdit) return;
    setClients(prev => prev.map(p => p.id === clientToEdit.id ? {...clientToEdit, ...updatedClient} : p))
  }

  const handleOpenEditDialog = (client: Client) => {
    setClientToEdit(client);
    setIsAddClientOpen(true);
  }
  
  const handleOpenAddDialog = () => {
    setClientToEdit(undefined);
    setIsAddClientOpen(true);
  }

  const handleDeleteClient = (clientId: string) => {
    setItemToDelete(clientId);
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          setClients(prev => prev.filter(c => c.id !== itemToDelete));
          setItemToDelete(null);
          setSelectedIds(prev => prev.filter(id => id !== itemToDelete));
      } else {
          setClients(prev => prev.filter(client => !selectedIds.includes(client.id)));
          setSelectedIds([]);
      }
      setIsBulkDeleteConfirmOpen(false);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Delete: Ctrl + Shift + Backspace OR Delete key
      if ((e.ctrlKey && e.shiftKey && e.key === 'Backspace') || e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          setItemToDelete(null);
          setIsBulkDeleteConfirmOpen(true);
        }
      }
      
      // Select All: Ctrl + A
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(clients.map(c => c.id));
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clients]);

  const activeClients = clients.filter(c => c.status === 'active').length;
  const leadClients = clients.filter(c => c.status === 'lead').length;

  if (!isClient) {
      return (
        <div className="space-y-6">
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-96" />
        </div>
      )
  }

  return (
    <>
      <div 
        className="space-y-6 select-none min-h-screen"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
          {selectionBox && selectionBox.isSelecting && (
            <div
                className="fixed z-50 bg-primary/20 border border-primary/30 rounded-md pointer-events-none"
                style={{
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY)
                }}
            />
          )}
          <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard title="Active Clients" icon={UserCheck} value={String(activeClients)} />
              <KpiCard title="Leads" icon={Users} value={String(leadClients)} />
          </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>All Clients</CardTitle>
                    <CardDescription>A list of all your clients and their status.</CardDescription>
                </div>
                <Button onClick={handleOpenAddDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Client
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Client</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length > 0 ? clients.map(client => (
                            <ContextMenu key={client.id}>
                                <ContextMenuTrigger asChild>
                                    <TableRow 
                                        data-selectable="true"
                                        data-id={client.id}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            selectedIds.includes(client.id) && "bg-primary/10 hover:bg-primary/15"
                                        )}
                                        onClick={(e) => handleToggleSelection(client.id, e)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{client.name}</p>
                                                    <p className="text-sm text-muted-foreground">{client.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{client.company || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="h-6">
                                                <div className={cn("h-2 w-2 rounded-full mr-2", statusConfig[client.status].color)}></div>
                                                {statusConfig[client.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{client.notes || '-'}</TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(client)}>
                                                        Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
                                                        Delete Client
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-56">
                                        <ContextMenuItem onClick={() => handleOpenEditDialog(client)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Details
                                        </ContextMenuItem>
                                    <ContextMenuItem className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Client
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No clients yet. Click "Add Client" to get started!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      <AddClientDialog 
        isOpen={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSave={clientToEdit ? handleEditClient : handleAddClient}
        clientToEdit={clientToEdit}
      />
      
      {selectedIds.length > 1 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-foreground/5 backdrop-blur-md border border-foreground/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 text-sm font-medium pr-4 border-r border-border/50">
                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {selectedIds.length}
                </span>
                <span>Selected</span>
            </div>
            <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full shadow-sm hover:shadow-md transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsBulkDeleteConfirmOpen(true);
                }}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-background/50"
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIds([]);
                }}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
      )}

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={(open) => {
        setIsBulkDeleteConfirmOpen(open);
        if (!open) setItemToDelete(null);
      }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    {itemToDelete 
                        ? "This will permanently delete this client. This action cannot be undone."
                        : `This will permanently delete the ${selectedIds.length} selected ${selectedIds.length === 1 ? 'client' : 'clients'}. This action cannot be undone.`
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
