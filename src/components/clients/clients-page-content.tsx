

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client } from '@/lib/types';
import AddClientDialog from '@/components/clients/add-client-dialog';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '@/components/layout/app-provider';


const statusConfig: Record<Client['status'], { label: string; color: string }> = {
    'lead': { label: 'Lead', color: 'bg-yellow-500' },
    'active': { label: 'Active', color: 'bg-green-500' },
    'inactive': { label: 'Inactive', color: 'bg-gray-500' },
};


export default function ClientsPageContent() {
  const { clients, setClients } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);

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
    setClients(prev => prev.filter(p => p.id !== clientId));
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const activeClients = clients.filter(c => c.status === 'active').length;
  const leadClients = clients.filter(c => c.status === 'lead').length;

  if (!isClient) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-48" />
        </div>
      )
  }

  return (
    <>
      <div className="space-y-6">
          <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard title="Active Clients" icon={UserCheck} value={String(activeClients)} />
              <KpiCard title="Leads" icon={Users} value={String(leadClients)} />
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">All Clients</h2>
            <Button onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Client
            </Button>
          </div>
          
          <div className="space-y-4">
            {clients.length > 0 ? clients.map(client => (
                <Card key={client.id} className="bg-card/50">
                    <CardContent className="p-4 flex items-start gap-4">
                        <Avatar>
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                            {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                            {client.notes && <p className="text-sm text-foreground mt-2 pt-2 border-t">{client.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge variant="outline" className="h-6">
                                <div className={cn("h-2 w-2 rounded-full mr-2", statusConfig[client.status].color)}></div>
                                {statusConfig[client.status].label}
                            </Badge>
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
                        </div>
                    </CardContent>
                </Card>
            )) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No clients yet. Click "Add Client" to get started!</p>
                </div>
            )}
          </div>
      </div>
      <AddClientDialog 
        isOpen={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSave={clientToEdit ? handleEditClient : handleAddClient}
        clientToEdit={clientToEdit}
      />
    </>
  );
}
