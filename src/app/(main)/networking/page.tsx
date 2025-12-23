
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Users, CalendarDays } from 'lucide-react';
import type { NetworkContact } from '@/lib/types';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp } from '@/components/layout/app-provider';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AddContactDialog from '@/components/networking/add-contact-dialog';

export default function NetworkingPage() {
  const { networkContacts, setNetworkContacts } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<NetworkContact | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleSaveContact = (contactData: Omit<NetworkContact, 'id'>) => {
    if (contactToEdit) {
      setNetworkContacts(prev => prev.map(c => c.id === contactToEdit.id ? { ...contactToEdit, ...contactData } : c));
    } else {
      const newContact: NetworkContact = { ...contactData, id: `nc-${Date.now()}` };
      setNetworkContacts(prev => [newContact, ...prev]);
    }
  };
  
  const handleOpenEditDialog = (contact: NetworkContact) => {
    setContactToEdit(contact);
    setIsAddContactOpen(true);
  }
  
  const handleOpenAddDialog = () => {
    setContactToEdit(undefined);
    setIsAddContactOpen(true);
  }

  const handleDeleteContact = (contactId: string) => {
    setNetworkContacts(prev => prev.filter(c => c.id !== contactId));
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const contactsToFollowUp = networkContacts.filter(c => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(c.lastContacted) < threeMonthsAgo;
  }).length;

  if (!isClient) {
      return (
        <div className="space-y-6">
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
              <KpiCard title="Total Contacts" icon={Users} value={String(networkContacts.length)} />
              <KpiCard title="Follow-up Needed" icon={CalendarDays} value={String(contactsToFollowUp)} />
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">All Contacts</h2>
            <Button onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Contact
            </Button>
          </div>
          
          <div className="space-y-4">
            {networkContacts.length > 0 ? networkContacts.map(contact => (
                <Card key={contact.id} className="bg-card/50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-start gap-4">
                        <Avatar>
                            <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.role} at {contact.company}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Last contacted: {formatDistanceToNow(new Date(contact.lastContacted), { addSuffix: true })}
                            </p>
                            {contact.notes && <p className="text-sm text-foreground mt-2 pt-2 border-t">{contact.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(contact)}>
                                        Edit Contact
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteContact(contact.id)}>
                                        Delete Contact
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            )) : (
                <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No contacts yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Click "Add Contact" to get started!</p>
                </div>
            )}
          </div>
      </div>
      <AddContactDialog 
        isOpen={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
        onSave={handleSaveContact}
        contactToEdit={contactToEdit}
      />
    </>
  );
}
