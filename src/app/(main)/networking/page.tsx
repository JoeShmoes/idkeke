
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Users, CalendarDays } from 'lucide-react';
import type { NetworkContact } from '@/lib/types';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useApp } from '@/components/layout/app-provider';
import { formatDistanceToNow } from 'date-fns';
import { cn, copyToClipboard } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AddContactDialog from '@/components/networking/add-contact-dialog';

export default function NetworkingPage() {
  const { networkContacts, setNetworkContacts } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<NetworkContact | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
            {networkContacts.length > 0 ? networkContacts.map(contact => {
                            return (
                                <ContextMenu key={contact.id}>
                                    <ContextMenuTrigger>
                                        <Card 
                                            data-selectable="true"
                                            data-id={contact.id}
                                            className={cn(
                                                "bg-card/50 hover:shadow-lg transition-all flex flex-col cursor-pointer",
                                                selectedIds.includes(contact.id) && "ring-2 ring-primary bg-primary/10"
                                            )}
                                            onClick={(e) => handleToggleSelection(contact.id, e)}
                                        >
                                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-base font-semibold">{contact.name}</CardTitle>
                                                        <CardDescription>{contact.role} at {contact.company}</CardDescription>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
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
                                            </CardHeader>
                                            <CardContent className="mt-4 flex-grow">
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center text-muted-foreground">
                                                        <Mail className="mr-2 h-3 w-3" />
                                                        {contact.email}
                                                    </div>
                                                    {contact.phone && (
                                                        <div className="flex items-center text-muted-foreground">
                                                            <Phone className="mr-2 h-3 w-3" />
                                                            {contact.phone}
                                                        </div>
                                                    )}
                                                    {contact.linkedIn && (
                                                        <div className="flex items-center text-muted-foreground">
                                                            <Linkedin className="mr-2 h-3 w-3" />
                                                            <a href={contact.linkedIn} target="blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                                                                LinkedIn Profile
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {contact.tags.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between items-center">
                                                    <span>Last Contacted: {formatDistanceToNow(new Date(contact.lastContacted), { addSuffix: true })}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="w-56">
                                        <ContextMenuItem onClick={() => handleOpenEditDialog(contact)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Contact
                                        </ContextMenuItem>
                                        <ContextMenuItem className="text-destructive" onClick={() => handleDeleteContact(contact.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Contact
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            )
                        }) : (
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
