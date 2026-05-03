

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
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useNotifications } from '@/hooks/use-notifications';
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
  const { appSettings, userProfile } = useApp();
  const { subscribe } = usePushNotifications(userProfile.id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [groupId, setGroupId] = useState(appSettings.tasks.defaultGroupId);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [repeatDays, setRepeatDays] = useState<RepeatDays>(initialRepeatDays);
  
  useEffect(() => {
    if (task && isOpen) {
        setName(task.name);
        setDescription(task.description || '');
        setNotifications(task.notifications);
        setGroupId(task.groupId);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setPriority(task.priority || 'medium');
        setRepeatDays(task.repeat || initialRepeatDays);
    } else if (!task && isOpen) {
        setName('');
        setDescription('');
        setNotifications(true);
        setGroupId(appSettings.tasks.defaultGroupId);
        setDueDate(undefined);
        setPriority('medium');
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
      priority,
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
      <DialogContent className="max-w-[90vw] w-[440px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[300]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
        
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
            {task ? 'Edit Task' : 'New Task'}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
            Structure your productivity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 overflow-hidden">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-8 sm:space-y-10 pb-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Task Identity</Label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="What needs to be done?" 
                  className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all text-white placeholder:text-white/20"
                  autoFocus 
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Refinement</Label>
                <Textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Add context or notes..." 
                  className="min-h-[140px] rounded-[32px] text-lg bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 py-6 transition-all resize-none text-white placeholder:text-white/20" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Category</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id} className="rounded-2xl py-4 focus:bg-white/10">{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-14 sm:h-16 w-full rounded-[28px] bg-white/5 border-none px-6 flex items-center justify-between font-bold text-white", !dueDate && "opacity-40")}>
                        {dueDate ? format(dueDate, "MMM d") : "Schedule"}
                        <CalendarIcon className="h-5 w-5 opacity-30" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="z-[1000] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[300px] p-5 rounded-[40px] overflow-hidden border-2 border-white/10 bg-[#1A1A1A] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col items-center animate-in fade-in zoom-in duration-200"
                    >
                      <div className="w-12 h-1 rounded-full bg-white/10 mb-4 shrink-0" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">Deadline</div>
                      <div className="flex-1 overflow-y-auto w-full flex justify-center">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="bg-transparent text-white w-full" />
                      </div>
                      <div className="w-full h-px bg-white/5 my-4" />
                      <Button onClick={(e) => { e.preventDefault(); (document.querySelector('button[aria-expanded="true"]') as any)?.click(); }} className="h-14 w-full rounded-[24px] font-black uppercase tracking-widest bg-indigo-500 text-white active:scale-95 transition-transform">Confirm</Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-6 sm:space-y-8 bg-white/5 p-6 sm:p-8 rounded-[40px] border border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <Label className="font-bold text-lg text-white">Notifications</Label>
                      <span className="text-[10px] opacity-40 uppercase font-black">Alert on deadline</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch 
                      checked={notifications} 
                      onCheckedChange={async (val) => {
                        if (val) {
                          await subscribe();
                        }
                        setNotifications(val);
                      }} 
                      className="data-[state=checked]:bg-indigo-500" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Priority Level</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cn(
                          "h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
                          priority === p 
                            ? "bg-white text-black border-white shadow-2xl shadow-white/10" 
                            : "bg-white/5 border-transparent opacity-30 hover:opacity-100 hover:bg-white/10"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Recurrence Cycle</Label>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-bold opacity-60">Everyday</span>
                      <Switch checked={repeatDays.everyday} onCheckedChange={() => handleRepeatChange('everyday')} className="data-[state=checked]:bg-indigo-500" />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      {weekDays.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleRepeatChange(day)}
                          className={cn(
                            "h-11 w-11 rounded-full text-[12px] font-black transition-all border-2",
                            repeatDays[day] 
                              ? "bg-indigo-500 border-indigo-500 text-white" 
                              : "bg-white/5 border-transparent opacity-30"
                          )}
                        >
                          {day.substring(0, 1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 sm:pt-6 gap-4 sm:flex-row flex-col">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
              {task ? 'Update' : 'Commit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
