'use client';

import { useApp } from '@/components/layout/app-provider';
import { useSound } from '@/hooks/use-sound';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar as CalendarIcon,
  Search,
  MoreVertical,
  Plus,
  ClipboardList,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  FolderPlus,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Bell,
  RefreshCw
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { format, isPast, isToday, isBefore, startOfToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { Task, TaskGroup, RepeatDays } from '@/lib/types';

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

export default function MobileTasks() {
  const { 
    tasks, 
    setTasks, 
    taskGroups, 
    setTaskGroups, 
    userProfile, 
    setUserProfile,
    setIsNavHidden,
    appSettings,
    setAppSettings
  } = useApp();
  
  const { playSound } = useSound();
  const { subscribe, scheduleNotification, cancelNotification, showNow } = usePushNotifications(userProfile.id);
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return new Set(appSettings.tasks.expandedGroups || ['default']);
  });

  // Sync expanded groups to app settings
  useEffect(() => {
    setAppSettings(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        expandedGroups: Array.from(expandedGroups)
      }
    }));
  }, [expandedGroups, setAppSettings]);
  
  // Sheet States
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
  
  // Form States (Task)
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskGroupId, setTaskGroupId] = useState('default');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [taskRepeat, setTaskRepeat] = useState<RepeatDays>(initialRepeatDays);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form States (Group)
  const [groupName, setGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Effect to hide nav
  useEffect(() => {
    setIsNavHidden(isTaskSheetOpen || isGroupSheetOpen);
  }, [isTaskSheetOpen, isGroupSheetOpen, setIsNavHidden]);

  const groupedTasks = useMemo(() => {
    return taskGroups
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(group => ({
        ...group,
        tasks: tasks
          .filter(t => t.groupId === group.id)
          .sort((a, b) => {
              if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          })
      }));
  }, [tasks, taskGroups]);

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      playSound('good');
      showNow(`Task Completed!`, `"${task.name}" has been marked as done.`);
    }
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
    ));
  };

  const toggleGroup = (groupId: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupId)) newSet.delete(groupId);
    else newSet.add(groupId);
    setExpandedGroups(newSet);
    localStorage.setItem('mobile_tasks_expanded_groups', JSON.stringify(Array.from(newSet)));
  };

  const handleLogout = () => {
    setUserProfile(null);
    router.push('/login');
  };

  // Task Form Logic
  const openNewTask = () => {
    setTaskName('');
    setTaskDesc('');
    setTaskGroupId('default');
    setTaskDueDate(undefined);
    setTaskPriority('medium');
    setTaskNotifications(true);
    setTaskRepeat(initialRepeatDays);
    setEditingTaskId(null);
    setIsTaskSheetOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskName(task.name);
    setTaskDesc(task.description || '');
    setTaskGroupId(task.groupId);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setTaskPriority(task.priority || 'medium');
    setTaskNotifications(task.notifications);
    setTaskRepeat(task.repeat || initialRepeatDays);
    setEditingTaskId(task.id);
    setIsTaskSheetOpen(true);
  };

  const handleRepeatChange = (day: keyof RepeatDays) => {
    setTaskRepeat(prev => {
        const newDays = { ...prev };
        if (day === 'everyday') {
            const isTurningOn = !newDays.everyday;
            for (const d of weekDays) newDays[d] = isTurningOn;
            newDays.everyday = isTurningOn;
        } else {
            newDays[day] = !newDays[day];
            const allWeekdaysChecked = weekDays.every(d => newDays[d]);
            newDays.everyday = allWeekdaysChecked;
        }
        return newDays;
    });
  }

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    // Clear background notifications for this task
    cancelNotification(`task-reminder-${id}`);
    cancelNotification(`task-overdue-${id}`);
    // Sound removed for delete per user request for less noise
  };

  const saveTask = () => {
    if (!taskName.trim()) return;

    let finalTaskId = editingTaskId;

    if (editingTaskId) {
      setTasks(prev => prev.map(t => t.id === editingTaskId ? {
        ...t,
        name: taskName,
        description: taskDesc,
        groupId: taskGroupId,
        dueDate: taskDueDate?.toISOString(),
        priority: taskPriority,
        notifications: taskNotifications,
        repeat: taskRepeat,
        updatedAt: new Date().toISOString()
      } : t));
    } else {
      const groupTasks = tasks.filter(t => t.groupId === taskGroupId);
      const maxOrder = groupTasks.length > 0 ? Math.max(...groupTasks.map(t => t.order || 0)) : -1;

      const newId = crypto.randomUUID();
      finalTaskId = newId;
      const newTask: Task = {
        id: newId,
        name: taskName,
        description: taskDesc,
        groupId: taskGroupId,
        dueDate: taskDueDate?.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notifications: taskNotifications,
        priority: taskPriority,
        repeat: taskRepeat,
        status: 'todo',
        text: taskName,
        order: maxOrder + 1
      };
      setTasks(prev => [...prev, newTask]);
    }

    // Background Notification Logic
    if (taskNotifications && taskDueDate) {
      const d = new Date(taskDueDate);
      // Ensure exactly 12 AM if no time was specified
      d.setHours(0, 0, 0, 0);
      const fireAt = d.getTime();
      const now = Date.now();

      // Clear existing first
      cancelNotification(`task-reminder-${finalTaskId}`);
      cancelNotification(`task-overdue-${finalTaskId}`);

      if (fireAt > now) {
        // Schedule exact time notification
        scheduleNotification({
          id: `task-overdue-${finalTaskId}`,
          title: `‼️ Task Due: ${taskName}`,
          body: `The deadline for "${taskName}" has been reached.`,
          url: '/tasks',
          fireAt: new Date(fireAt)
        });
      }
    } else {
      // If notifications turned off or no date, clear any scheduled ones
      cancelNotification(`task-overdue-${finalTaskId}`);
    }

    setIsTaskSheetOpen(false);
  };

  // Rearranging Logic
  const moveTask = (e: React.MouseEvent, taskId: string, direction: 'up' | 'down') => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const groupTasks = tasks
      .filter(t => t.groupId === task.groupId)
      .sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    const currentIndex = groupTasks.findIndex(t => t.id === taskId);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex >= 0 && swapIndex < groupTasks.length) {
      const swapTask = groupTasks[swapIndex];
      const now = new Date().toISOString();

      setTasks(prev => prev.map(t => {
        // Update both tasks being swapped
        if (t.id === taskId) return { ...t, order: swapIndex, updatedAt: now };
        if (t.id === swapTask.id) return { ...t, order: currentIndex, updatedAt: now };
        
        // Also normalize other tasks in this group to have consistent indices as orders
        if (t.groupId === task.groupId) {
          const idx = groupTasks.findIndex(gt => gt.id === t.id);
          return { ...t, order: idx };
        }
        return t;
      }));
    }
  };

  const moveGroup = (e: React.MouseEvent, groupId: string, direction: 'up' | 'down') => {
    e.stopPropagation();
    const groupIndex = taskGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    
    const newGroups = [...taskGroups];
    const targetIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newGroups.length) {
      [newGroups[groupIndex], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[groupIndex]];
      setTaskGroups(newGroups);
    }
  };

  // Group Form Logic
  const openNewGroup = () => {
    setGroupName('');
    setEditingGroupId(null);
    setIsGroupSheetOpen(true);
  };

  const handleEditGroup = (group: TaskGroup) => {
    setGroupName(group.name);
    setEditingGroupId(group.id);
    setIsGroupSheetOpen(true);
  };

  const saveGroup = () => {
    if (!groupName.trim()) return;

    if (editingGroupId) {
      setTaskGroups(prev => prev.map(g => g.id === editingGroupId ? { ...g, name: groupName } : g));
    } else {
      const newGroup: TaskGroup = {
        id: crypto.randomUUID(),
        name: groupName
      };
      setTaskGroups(prev => [...prev, newGroup]);
    }
    setIsGroupSheetOpen(false);
    playSound('good');
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#050505] overflow-hidden md:hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-4 shrink-0 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-b border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden active:scale-95 transition-all shadow-sm">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 opacity-40" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 mt-2 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border-black/5 dark:border-white/10 shadow-2xl">
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-bold">{userProfile?.name || 'User'}</span>
              <span className="text-[10px] opacity-50">{userProfile?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-col items-center text-center px-4 min-w-0">
          <span className="text-[17px] font-black tracking-tight uppercase italic opacity-90 truncate w-full">Tasks</span>
          <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.1em] truncate w-full">Manage your focus</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={openNewGroup} className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center active:scale-90 transition-all">
            <FolderPlus className="h-4 w-4 opacity-60" />
          </button>
          <button onClick={openNewTask} className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 active:scale-90 transition-all">
            <Plus className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-40 px-6">
        <div className="py-8 space-y-8">
          {groupedTasks.map((group, groupIdx) => {
            const isExpanded = expandedGroups.has(group.id);
            const hasOverdue = group.tasks.some(t => t.dueDate && !t.completed && isBefore(new Date(t.dueDate), startOfToday()));

            return (
              <div 
                key={group.id} 
                className={cn(
                  "rounded-[32px] overflow-hidden transition-all border",
                  isExpanded 
                    ? "bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 shadow-sm" 
                    : "bg-transparent border-transparent"
                )}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 opacity-20">
                      <button onClick={(e) => moveGroup(e, group.id, 'up')} disabled={groupIdx === 0} className="active:scale-125 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={(e) => moveGroup(e, group.id, 'down')} disabled={groupIdx === taskGroups.length - 1} className="active:scale-125 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => toggleGroup(group.id)} className="flex items-center gap-3 active:opacity-60 transition-opacity text-left">
                      <span className={cn("text-xs font-black uppercase tracking-[0.2em]", hasOverdue ? "text-red-500" : "text-muted-foreground opacity-40")}>{group.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-[10px] font-bold opacity-60">{group.tasks.length}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {group.id !== 'default' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 opacity-20 hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditGroup(group)}><Pencil className="h-4 w-4 mr-2" /> Edit Group</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setTaskGroups(prev => prev.filter(g => g.id !== group.id));
                            }} className="text-red-500"><Trash2 className="h-4 w-4 mr-2" /> Delete Group</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <button onClick={() => toggleGroup(group.id)} className="p-2 opacity-20">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-4 space-y-2">
                      {group.tasks.map((task, taskIdx) => (
                        <div key={task.id} className={cn("flex items-start gap-4 p-4 rounded-[24px] bg-zinc-50 dark:bg-white/5 border border-black/[0.01] dark:border-white/[0.01] active:scale-[0.98] transition-all relative group/task", task.completed && "opacity-30")}>
                          <div className="flex flex-col gap-1 mt-1 opacity-10 group-hover/task:opacity-40 transition-opacity">
                            <button onClick={(e) => moveTask(e, task.id, 'up')} disabled={taskIdx === 0} className="active:scale-125 disabled:opacity-10"><ArrowUp className="h-3 w-3" /></button>
                            <button onClick={(e) => moveTask(e, task.id, 'down')} disabled={taskIdx === group.tasks.length - 1} className="active:scale-125 disabled:opacity-10"><ArrowDown className="h-3 w-3" /></button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className={cn("h-6 w-6 mt-0.5 rounded-full border-2 transition-all shrink-0 flex items-center justify-center", task.completed ? "bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-zinc-200 dark:border-zinc-800")}>
                            {task.completed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0 pr-12" onClick={() => handleEditTask(task)}>
                            <p className={cn("font-bold text-[16px] leading-snug", task.completed && "line-through")}>{task.name}</p>
                            <div className="flex items-center gap-3 mt-1 opacity-40">
                              {task.dueDate && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span className={cn("text-[11px] font-black uppercase tracking-tighter", isBefore(new Date(task.dueDate), startOfToday()) && !task.completed && "text-red-500 opacity-100")}>
                                    {isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'MMM d')}
                                  </span>
                                </div>
                              )}
                              {task.priority === 'high' && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase">High</span>}
                              {task.repeat?.everyday && <RefreshCw className="h-3 w-3" />}
                            </div>
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                             <button onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className="p-2 opacity-40 hover:opacity-100 text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-2 opacity-40 hover:opacity-100 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Editor (Centered Dialog) */}
      <Dialog open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
        <DialogContent className="max-w-[95vw] w-[440px] max-h-[calc(100dvh-40px)] rounded-[48px] px-5 sm:px-8 pt-10 sm:pt-12 pb-8 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[400]">
          
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
              {editingTaskId ? 'Edit Task' : 'New Task'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
              Structure your productivity
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-8 sm:space-y-10 overflow-y-auto pr-2 pb-6 scrollbar-none">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Task Identity</Label>
              <div className="relative group">
                <Input 
                  value={taskName} 
                  onChange={e => setTaskName(e.target.value)} 
                  placeholder="What needs to be done?" 
                  className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all"
                  autoFocus 
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Refinement</Label>
              <Textarea 
                value={taskDesc} 
                onChange={e => setTaskDesc(e.target.value)} 
                placeholder="Add context or notes..." 
                className="min-h-[140px] rounded-[32px] text-lg bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 py-6 transition-all resize-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Category</Label>
                <Select value={taskGroupId} onValueChange={setTaskGroupId}>
                  <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white z-[1000]">
                    {taskGroups.map(g => (
                      <SelectItem key={g.id} value={g.id} className="rounded-2xl py-4 focus:bg-white/10">{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-14 sm:h-16 w-full rounded-[28px] bg-white/5 border-none px-6 flex items-center justify-between font-bold text-white", !taskDueDate && "opacity-40")}>
                      {taskDueDate ? format(taskDueDate, "MMM d") : "Schedule"}
                      <CalendarIcon className="h-5 w-5 opacity-30" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="z-[1000] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[300px] p-5 rounded-[40px] overflow-hidden border-2 border-white/10 bg-[#0F0F0F] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col items-center animate-in fade-in zoom-in duration-200" 
                  >
                    <div className="w-12 h-1 rounded-full bg-white/10 mb-4 shrink-0" />
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">Deadline</div>
                    <div className="flex-1 overflow-y-auto w-full flex justify-center">
                      <Calendar mode="single" selected={taskDueDate} onSelect={setTaskDueDate} initialFocus className="bg-transparent text-white w-full" />
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
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <Label className="font-bold text-lg text-white">Notifications</Label>
                    <span className="text-[10px] opacity-40 uppercase font-black">Alert on deadline</span>
                  </div>
                </div>
                <div className="ml-4">
                  <Switch 
                    checked={taskNotifications} 
                    onCheckedChange={async (val) => {
                      if (val) {
                        const success = await subscribe();
                        if (!success) {
                          // If push fails, we still allow local notifications
                          // but the user should know background won't work.
                        }
                      }
                      setTaskNotifications(val);
                    }} 
                    className="data-[state=checked]:bg-indigo-500" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Priority Level</Label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className={cn(
                        "h-12 sm:h-14 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all border-2",
                        taskPriority === p 
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
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <Label className="font-bold text-lg text-white">Recurrence</Label>
                    <span className="text-[10px] opacity-40 uppercase font-black">Repeating cycle</span>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold opacity-60">Everyday Cycle</span>
                    <Switch checked={taskRepeat.everyday} onCheckedChange={() => handleRepeatChange('everyday')} className="data-[state=checked]:bg-indigo-500" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {weekDays.map(day => (
                      <button
                        key={day}
                        onClick={() => handleRepeatChange(day)}
                        className={cn(
                          "h-10 w-10 sm:h-11 sm:w-11 rounded-full text-[11px] sm:text-[12px] font-black transition-all border-2",
                          taskRepeat[day] 
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

          <DialogFooter className="pt-4 sm:pt-6 gap-4 sm:flex-row flex-col mt-auto">
            <Button variant="ghost" onClick={() => setIsTaskSheetOpen(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={saveTask} className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
              <Check className="h-6 w-6" strokeWidth={3} />
              {editingTaskId ? 'Update' : 'Commit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Editor (Centered Dialog) */}
      <Dialog open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
        <DialogContent className="max-w-[90vw] w-[400px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 z-[300]">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
              {editingGroupId ? 'Edit Group' : 'New Group'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
              Organize your workflow
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Group Name</Label>
            <Input 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
              placeholder="e.g. Marketing, Personal..." 
              className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all"
              autoFocus 
            />
          </div>
          <DialogFooter className="gap-4 sm:flex-row flex-col mt-auto">
            <Button variant="ghost" onClick={() => setIsGroupSheetOpen(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white">Cancel</Button>
            <Button onClick={saveGroup} className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3">
              <Check className="h-6 w-6" />
              {editingGroupId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
