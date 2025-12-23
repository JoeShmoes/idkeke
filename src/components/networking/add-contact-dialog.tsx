
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
import type { NetworkContact } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddContactDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (contact: Omit<NetworkContact, 'id'>) => void;
  contactToEdit?: NetworkContact;
}

export default function AddContactDialog({ isOpen, onOpenChange, onSave, contactToEdit }: AddContactDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [lastContacted, setLastContacted] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (contactToEdit) {
            setName(contactToEdit.name);
            setRole(contactToEdit.role);
            setCompany(contactToEdit.company);
            setLastContacted(new Date(contactToEdit.lastContacted));
            setNotes(contactToEdit.notes || '');
        } else {
            setName('');
            setRole('');
            setCompany('');
            setLastContacted(new Date());
            setNotes('');
        }
    }
  }, [contactToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !company.trim() || !lastContacted) return;
    onSave({ name, role, company, lastContacted: lastContacted.toISOString(), notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              Enter the details for your contact below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contact Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Sarah Chen" 
                required
                autoFocus
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                placeholder="e.g., Senior Product Manager" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                placeholder="e.g., Innovate Inc." 
                required
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="lastContacted">Last Contacted</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !lastContacted && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {lastContacted ? format(lastContacted, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={lastContacted}
                            onSelect={setLastContacted}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any relevant notes (e.g., where you met, common interests)."
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{contactToEdit ? 'Save Changes' : 'Create Contact'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
