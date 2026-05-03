'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TaskGroup } from '@/lib/types';

interface BulkEditDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onBulkUpdate: (updates: BulkUpdates) => void;
    selectedCount: number;
    groups: TaskGroup[];
}

export interface BulkUpdates {
    completed?: boolean;
    groupId?: string;
    dueDate?: string | null; // null means clear date
}

export default function BulkEditDialog({ isOpen, onOpenChange, onBulkUpdate, selectedCount, groups }: BulkEditDialogProps) {
    const [status, setStatus] = useState<'no-change' | 'completed' | 'incomplete'>('no-change');
    const [groupId, setGroupId] = useState<string>('no-change');
    const [dueDateAction, setDueDateAction] = useState<'no-change' | 'set' | 'clear'>('no-change');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

    const handleSubmit = () => {
        const updates: BulkUpdates = {};
        
        if (status !== 'no-change') {
            updates.completed = status === 'completed';
        }

        if (groupId !== 'no-change') {
            updates.groupId = groupId;
        }

        if (dueDateAction === 'clear') {
            updates.dueDate = null;
        } else if (dueDateAction === 'set' && dueDate) {
            updates.dueDate = dueDate.toISOString();
        }

        onBulkUpdate(updates);
        onOpenChange(false);
        // Reset form
        setStatus('no-change');
        setGroupId('no-change');
        setDueDateAction('no-change');
        setDueDate(undefined);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] w-[440px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[300]">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
                
                <DialogHeader className="text-left space-y-1">
                    <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
                        Bulk Edit
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
                        Managing {selectedCount} items
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 sm:space-y-8 py-4 overflow-y-auto pr-2 scrollbar-none">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Status Update</Label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                            <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                                <SelectValue placeholder="No Change" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                                <SelectItem value="no-change" className="rounded-2xl py-4">No Change</SelectItem>
                                <SelectItem value="completed" className="rounded-2xl py-4">Mark as Completed</SelectItem>
                                <SelectItem value="incomplete" className="rounded-2xl py-4">Mark as Incomplete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Relocate Group</Label>
                        <Select value={groupId} onValueChange={setGroupId}>
                            <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                                <SelectValue placeholder="No Change" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                                <SelectItem value="no-change" className="rounded-2xl py-4">No Change</SelectItem>
                                {groups.map(group => (
                                    <SelectItem key={group.id} value={group.id} className="rounded-2xl py-4">{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Timeline Action</Label>
                        <div className="space-y-4">
                            <Select value={dueDateAction} onValueChange={(v: any) => setDueDateAction(v)}>
                                <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                                    <SelectValue placeholder="No Change" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                                    <SelectItem value="no-change" className="rounded-2xl py-4">No Change</SelectItem>
                                    <SelectItem value="set" className="rounded-2xl py-4">Set Date</SelectItem>
                                    <SelectItem value="clear" className="rounded-2xl py-4 text-destructive">Clear Date</SelectItem>
                                </SelectContent>
                            </Select>
                            {dueDateAction === 'set' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "h-14 sm:h-16 w-full rounded-[28px] bg-indigo-500/10 border-indigo-500/20 px-6 flex items-center justify-between font-bold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all",
                                                !dueDate && "opacity-40"
                                            )}
                                        >
                                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="h-5 w-5 opacity-40" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-[40px] overflow-hidden border-white/10 bg-[#1A1A1A] shadow-2xl" align="center">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={setDueDate}
                                            initialFocus
                                            className="p-6 bg-[#1A1A1A] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 sm:pt-6 gap-4 sm:flex-row flex-col">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
                        Commit Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
