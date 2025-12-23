
'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client, ClientStatus } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (client: Omit<Client, 'id'>) => void;
  clientToEdit?: Client;
}

export default function AddClientDialog({ isOpen, onOpenChange, onSave, clientToEdit }: AddClientDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<ClientStatus>('lead');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (clientToEdit) {
            setName(clientToEdit.name);
            setEmail(clientToEdit.email);
            setCompany(clientToEdit.company || '');
            setStatus(clientToEdit.status);
            setNotes(clientToEdit.notes || '');
        } else {
            setName('');
            setEmail('');
            setCompany('');
            setStatus('lead');
            setNotes('');
        }
    }
  }, [clientToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave({ name, email, company, status, notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{clientToEdit ? 'Edit Client' : 'Create New Client'}</DialogTitle>
            <DialogDescription>
              Enter the details for your client below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Jane Doe" 
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="e.g., jane.doe@company.com" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                placeholder="e.g., Acme Inc." 
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: ClientStatus) => setStatus(value)}>
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any relevant notes about this client."
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{clientToEdit ? 'Save Changes' : 'Create Client'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
