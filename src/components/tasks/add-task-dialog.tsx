

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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task, TaskGroup, RepeatDays } from '@/lib/types';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useApp } from '../layout/app-provider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  groups: TaskGroup[];
  task?: Task; // For editing
}

const initialRepeatDays: RepeatDays = {
  everyday: false,
  Monday: false,
  Tuesday: false,
  Wednesday: false,
  Thursday: false,
  Friday: false,
  Saturday: false,
  Sunday: false,
};

const weekDays = Object.keys(initialRepeatDays).filter(d => d !== 'everyday') as (keyof Omit<RepeatDays, 'everyday'>)[];


export default function AddTaskDialog({ isOpen, onOpenChange, onAddTask, groups, task }: AddTaskDialogProps) {
  const { appSettings } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [groupId, setGroupId] = useState(appSettings.tasks.defaultGroupId);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [repeatDays, setRepeatDays] = useState<RepeatDays>(initialRepeatDays);
  
  useEffect(() => {
    if (task && isOpen) {
        setName(task.name);
        setDescription(task.description || '');
        setNotifications(task.notifications);
        setGroupId(task.groupId);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setRepeatDays(task.repeat || initialRepeatDays);
    } else if (!task && isOpen) {
        setName('');
        setDescription('');
        setNotifications(true);
        setGroupId(appSettings.tasks.defaultGroupId);
        setDueDate(undefined);
        setRepeatDays(initialRepeatDays);
    }
  }, [task, isOpen, appSettings.tasks.defaultGroupId]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTask({
      name,
      description,
      notifications,
      groupId,
      dueDate: dueDate?.toISOString(),
      repeat: repeatDays,
      // for search compatibility
      text: name,
      status: 'todo',
    });
    onOpenChange(false);
  };

  const handleRepeatChange = (day: keyof RepeatDays) => {
    setRepeatDays(prev => {
        const newDays = { ...prev };
        if (day === 'everyday') {
            const isTurningOn = !newDays.everyday;
            for (const d of weekDays) {
                newDays[d] = isTurningOn;
            }
            newDays.everyday = isTurningOn;
        } else {
            newDays[day] = !newDays[day];
            const allWeekdaysChecked = weekDays.every(d => newDays[d]);
            newDays.everyday = allWeekdaysChecked;
        }
        return newDays;
    });
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col h-full max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogDescription>
                  Fill in the details below to {task ? 'update your' : 'create a new'} task.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div className="grid gap-6 px-6 pb-6">
                  <div className="space-y-2">
                      <Label htmlFor="name">Task Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Finish the report" autoFocus />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details..." />
                  </div>
                  <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Notifications</Label>
                      <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
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
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="group">Group</Label>
                      <Select value={groupId} onValueChange={setGroupId}>
                          <SelectTrigger id="group">
                              <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                          {groups.map(group => (
                              <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <Separator />
                  <div>
                      <Label className="mb-3 block">Repeat</Label>
                      <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                              <Switch id="everyday" checked={repeatDays.everyday} onCheckedChange={() => handleRepeatChange('everyday')} />
                              <Label htmlFor="everyday" className="font-normal">Everyday</Label>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                              {weekDays.map(day => (
                                  <Button
                                    key={day}
                                    type="button"
                                    variant={repeatDays[day] ? 'secondary' : 'outline'}
                                    onClick={() => handleRepeatChange(day)}
                                    className={cn("h-8 w-8 p-0 rounded-full text-xs", repeatDays[day] && "bg-primary text-primary-foreground hover:bg-primary/90")}
                                  >
                                      {day.substring(0,1)}
                                  </Button>
                              ))}
                          </div>
                          <p className="text-xs text-muted-foreground pt-2">
                            Remember: If a repeating task is completed, it will become unchecked on the next scheduled day.
                          </p>
                      </div>
                  </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t mt-auto">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{task ? 'Save Changes' : 'Add Task'}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
