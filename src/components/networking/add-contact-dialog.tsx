
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
  const [icon, setIcon] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (contactToEdit) {
            setName(contactToEdit.name);
            setRole(contactToEdit.role);
            setCompany(contactToEdit.company);
            setLastContacted(new Date(contactToEdit.lastContacted));
            setNotes(contactToEdit.notes || '');
            setIcon(contactToEdit.icon || '');
        } else {
            setName('');
            setRole('');
            setCompany('');
            setLastContacted(new Date());
            setNotes('');
            setIcon('');
        }
    }
  }, [contactToEdit, isOpen])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        // Even if multiple are dropped, we take the last one as the intended icon
        const file = files[files.length - 1];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setIcon(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !company.trim() || !lastContacted) return;
    onSave({ 
        name, 
        role, 
        company, 
        lastContacted: lastContacted.toISOString(), 
        notes,
        icon 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
              <Label htmlFor="icon">Icon (Optional)</Label>
              <div className="flex flex-col gap-2">
                <div 
                    className={cn(
                        "border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-colors",
                        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('icon-upload')?.click()}
                >
                    {icon ? (
                        <div className="flex items-center gap-2">
                            {(icon.startsWith('data:image') || icon.startsWith('http')) ? (
                                <img src={icon} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                            ) : (
                                <span className="text-2xl">{icon}</span>
                            )}
                            <span className="text-sm text-muted-foreground">Click or Drop to change</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
                            <span className="text-2xl mb-2">📥</span>
                            <span>Drag & Drop image or Click to Upload</span>
                            <span className="text-xs opacity-70">or type an emoji below</span>
                        </div>
                    )}
                    <input 
                        id="icon-upload" 
                        type="file" 
                        multiple
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                                // Take the last selected file as the icon
                                const file = files[files.length - 1];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    setIcon(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                            }
                            // Reset input
                            e.target.value = '';
                        }} 
                    />
                </div>
                <div className="flex gap-2">
                    <Input 
                        id="icon" 
                        value={icon} 
                        onChange={(e) => setIcon(e.target.value)} 
                        placeholder="e.g., 👤 or Custom Icon" 
                        className="flex-1"
                    />
                    <div className="flex gap-1">
                        {['👤', '👔', '💼', '🏢', '🤝', '⭐'].map(emoji => (
                            <Button 
                                key={emoji} 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => setIcon(emoji)}
                                className="h-10 w-10"
                            >
                                {emoji}
                            </Button>
                        ))}
                    </div>
                </div>
              </div>
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
