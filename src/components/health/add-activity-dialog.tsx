
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
import type { Activity, ActivityCategory } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (activity: Omit<Activity, 'id'>) => void;
  activityToEdit?: Activity;
}

export default function AddActivityDialog({ isOpen, onOpenChange, onSave, activityToEdit }: AddActivityDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('combat');

  useEffect(() => {
    if (isOpen) {
        if (activityToEdit) {
            setTitle(activityToEdit.title);
            setDescription(activityToEdit.description);
            setCategory(activityToEdit.category);
        } else {
            setTitle('');
            setDescription('');
            setCategory('combat');
        }
    }
  }, [activityToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSave({ title, description, category });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[440px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[300]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
        
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
            {activityToEdit ? 'Edit Activity' : 'New Activity'}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
            Define your discipline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 overflow-hidden">
          <div className="space-y-6 sm:space-y-8 pb-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Activity Name</Label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="What are we training?" 
                className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all text-white placeholder:text-white/20"
                autoFocus 
              />
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Description</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe this activity."
                    className="min-h-[140px] rounded-[32px] text-lg bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 py-6 transition-all resize-none text-white placeholder:text-white/20"
                    required
                />
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Category</Label>
                <Select value={category} onValueChange={(value: ActivityCategory) => setCategory(value)}>
                    <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                        <SelectItem value="combat" className="rounded-2xl py-4">Combat</SelectItem>
                        <SelectItem value="endurance" className="rounded-2xl py-4">Endurance</SelectItem>
                        <SelectItem value="strength" className="rounded-2xl py-4">Strength</SelectItem>
                        <SelectItem value="flexibility" className="rounded-2xl py-4">Flexibility</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 sm:pt-6 gap-4 sm:flex-row flex-col mt-auto">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
              {activityToEdit ? 'Update' : 'Commit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
