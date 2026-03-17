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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Edit Tasks</DialogTitle>
                    <DialogDescription>
                        Update {selectedCount} selected tasks.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="No Change" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-change">No Change</SelectItem>
                                <SelectItem value="completed">Mark as Completed</SelectItem>
                                <SelectItem value="incomplete">Mark as Incomplete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="group" className="text-right">Group</Label>
                        <Select value={groupId} onValueChange={setGroupId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="No Change" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-change">No Change</SelectItem>
                                {groups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                        <div className="col-span-3 space-y-2">
                            <Select value={dueDateAction} onValueChange={(v: any) => setDueDateAction(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="No Change" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-change">No Change</SelectItem>
                                    <SelectItem value="set">Set Date</SelectItem>
                                    <SelectItem value="clear">Clear Date</SelectItem>
                                </SelectContent>
                            </Select>
                            {dueDateAction === 'set' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dueDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={setDueDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Update Tasks</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
