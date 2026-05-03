
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
import { Check } from 'lucide-react';
import type { TaskGroup } from '@/lib/types';

interface AddGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddGroup: (groupName: string) => void;
  onUpdateGroup?: (group: TaskGroup) => void;
  groupToEdit?: TaskGroup;
}

export default function AddGroupDialog({ isOpen, onOpenChange, onAddGroup, onUpdateGroup, groupToEdit }: AddGroupDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (groupToEdit && isOpen) {
        setName(groupToEdit.name);
    } else {
        setName('');
    }
  }, [groupToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (groupToEdit && onUpdateGroup) {
        onUpdateGroup({ ...groupToEdit, name });
    } else {
        onAddGroup(name);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[400px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 z-[300]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
        
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
            {groupToEdit ? 'Edit Group' : 'New Group'}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
            Organize your workflow
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Group Name</Label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Marketing, Personal..." 
              className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all text-white placeholder:text-white/20"
              autoFocus 
            />
          </div>

          <DialogFooter className="gap-4 sm:flex-row flex-col pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button type="submit" className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
              <Check className="h-6 w-6" />
              {groupToEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
