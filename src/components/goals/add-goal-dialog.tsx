
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
import type { Goal, GoalCategory, GoalStatus, Milestone } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface AddGoalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (goal: Omit<Goal, 'id'>) => void;
  goalToEdit?: Goal;
}

export default function AddGoalDialog({ isOpen, onOpenChange, onSave, goalToEdit }: AddGoalDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [status, setStatus] = useState<GoalStatus>('on-track');
  const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (goalToEdit) {
            setTitle(goalToEdit.title);
            setDescription(goalToEdit.description);
            setCategory(goalToEdit.category);
            setStatus(goalToEdit.status);
            setTargetDate(new Date(goalToEdit.targetDate));
            setMilestones(goalToEdit.milestones);
        } else {
            setTitle('');
            setDescription('');
            setCategory('personal');
            setStatus('on-track');
            setTargetDate(new Date());
            setMilestones([]);
        }
    }
  }, [goalToEdit, isOpen]);

  const handleAddMilestone = () => {
    if (newMilestoneText.trim()) {
      setMilestones([...milestones, { id: `ms-${Date.now()}`, text: newMilestoneText, completed: false }]);
      setNewMilestoneText('');
    }
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    onSave({ title, description, category, status, targetDate: targetDate.toISOString(), milestones });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>{goalToEdit ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            <DialogDescription>Set a target and break it down into actionable steps.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow -mx-6 px-6">
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Learn to Play Guitar" required autoFocus/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why is this goal important?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={(v: GoalCategory) => setCategory(v)}>
                            <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="financial">Financial</SelectItem>
                                <SelectItem value="health">Health</SelectItem>
                                <SelectItem value="learning">Learning</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(v: GoalStatus) => setStatus(v)}>
                            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="on-track">On Track</SelectItem>
                                <SelectItem value="at-risk">At Risk</SelectItem>
                                <SelectItem value="off-track">Off Track</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="achieved">Achieved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetDate">Target Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !targetDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-3">
                    <Label>Milestones</Label>
                    <div className="space-y-2">
                        {milestones.map(milestone => (
                            <div key={milestone.id} className="flex items-center gap-2">
                                <Input value={milestone.text} readOnly className="flex-1 bg-secondary" />
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveMilestone(milestone.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Input placeholder="New milestone..." value={newMilestoneText} onChange={(e) => setNewMilestoneText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())} />
                        <Button type="button" size="icon" onClick={handleAddMilestone}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                </div>
            </form>
        </ScrollArea>
        <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={handleSubmit}>{goalToEdit ? 'Save Changes' : 'Create Goal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
