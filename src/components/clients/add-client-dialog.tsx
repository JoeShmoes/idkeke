
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
import { ScrollArea } from '../ui/scroll-area';

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
      <DialogContent className="max-w-[90vw] w-[440px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[300]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
        
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
            {clientToEdit ? 'Edit Client' : 'New Client'}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
            Expand your network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 overflow-hidden">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-8 sm:space-y-10 pb-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Full Name</Label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Jane Doe" 
                  className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all text-white placeholder:text-white/20"
                  autoFocus 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Email</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="jane@doe.com" 
                    className="h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Organization</Label>
                  <Input 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="Acme Inc." 
                    className="h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Relationship Status</Label>
                  <Select value={status} onValueChange={(value: ClientStatus) => setStatus(value)}>
                      <SelectTrigger className="h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                          <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                          <SelectItem value="lead" className="rounded-2xl py-4">Lead</SelectItem>
                          <SelectItem value="active" className="rounded-2xl py-4">Active</SelectItem>
                          <SelectItem value="inactive" className="rounded-2xl py-4">Inactive</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Intelligence Notes</Label>
                  <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any relevant context..."
                      className="min-h-[140px] rounded-[32px] text-lg bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 py-6 transition-all resize-none text-white placeholder:text-white/20"
                  />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 sm:pt-6 gap-4 sm:flex-row flex-col mt-auto">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
              {clientToEdit ? 'Update' : 'Commit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
