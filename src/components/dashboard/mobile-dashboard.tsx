'use client';

import { useApp } from '@/components/layout/app-provider';
import { useLevel } from '@/hooks/use-level';
import { useSound } from '@/hooks/use-sound';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { 
  ClipboardList, 
  Notebook, 
  PenLine, 
  Plus, 
  ChevronRight, 
  User,
  LogOut,
  Sparkles,
  Calendar,
  Quote,
  Zap,
  ArrowRight,
  Clock,
  LayoutGrid,
  FileText,
  Activity,
  CheckCircle2,
  Trophy,
  Flame,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format, subDays, isSameDay, parseISO, isBefore, startOfToday } from 'date-fns';
import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" }
];
export default function MobileDashboard() {
  const { 
    userProfile, 
    tasks, 
    taskGroups,
    notes, 
    journals,
    setTasks,
    growthHistory,
    logout
  } = useApp();
  const { playSound } = useSound();
  const { showNow } = usePushNotifications();
  const { level, experience, nextLevelExperience, currentLevel, progressToNextLevel, totalPoints } = useLevel();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 18) return 'Afternoon';
    return 'Evening';
  }, []);

  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  // Group pending tasks for dashboard
  const groupedPendingTasks = useMemo(() => {
    if (!Array.isArray(tasks) || !Array.isArray(taskGroups)) return [];
    const pending = tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    const groups = taskGroups.map(group => ({
      ...group,
      tasks: pending.filter(t => t.groupId === group.id) // Show all tasks in the group
    }));
    return groups.filter(g => g.tasks.length > 0); // Show all groups that have tasks
  }, [tasks, taskGroups]);

  const currentStreak = useMemo(() => {
    if (!Array.isArray(growthHistory) || growthHistory.length === 0) return 0;
    const sortedHistory = [...growthHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date();
    const yesterday = subDays(today, 1);
    const datesWithActivity = new Set(sortedHistory.filter(h => h.xpGained > 0 || h.tasksCompleted > 0).map(h => h.date));
    let streak = 0;
    let checkDate = today;
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!datesWithActivity.has(todayStr) && !datesWithActivity.has(yesterdayStr)) return 0;
    if (!datesWithActivity.has(todayStr)) checkDate = yesterday;
    while (datesWithActivity.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
    return streak;
  }, [growthHistory]);

  if (!mounted) {
    return <div className="fixed inset-0 z-40 flex flex-col h-full bg-[#FFFFFF] dark:bg-[#000000] overflow-hidden md:hidden" />;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col h-full bg-[#FFFFFF] dark:bg-[#000000] overflow-hidden md:hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] pointer-events-none" />

      {/* Professional Header */}
      <div className="sticky top-0 z-50 px-4 py-4 h-18 shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-100 dark:border-white/[0.05] flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden active:scale-95 transition-all shadow-sm">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 opacity-40" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 mt-2 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-white/10 shadow-xl">
            <DropdownMenuLabel className="flex flex-col py-2">
              <span className="text-sm font-bold">{userProfile?.name || 'User'}</span>
              <span className="text-[10px] opacity-50 font-medium">{userProfile?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/5 py-2.5">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium text-sm">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-col items-center text-center px-4 min-w-0">
          <span className="text-[17px] font-black tracking-tight uppercase italic opacity-90 truncate w-full">Overview</span>
          <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.1em] truncate w-full">Your command center</span>
        </div>

        <button className="h-10 w-10 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center active:scale-90 transition-all">
          <Sparkles className="h-4 w-4 text-indigo-500 opacity-60" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-40 px-6">
        <div className="py-8 space-y-10">
          
          {/* Greeting Section */}
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Dashboard / {greeting}</p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Hi, {userProfile?.name?.split(' ')[0] || 'User'}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1.5 pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Lvl {currentLevel}</span>
              <div className="h-1.5 w-16 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNextLevel}%` }} className="h-full bg-indigo-500" />
              </div>
            </div>
          </div>

          {/* Core Modules */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/notes" className="p-5 rounded-[32px] bg-blue-500/5 border border-blue-500/10 active:scale-95 transition-all space-y-4 group">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Notebook className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Notes</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/60">{notes.length} saved</p>
              </div>
            </Link>

            <Link href="/journal" className="p-5 rounded-[32px] bg-rose-500/5 border border-rose-500/10 active:scale-95 transition-all space-y-4 group">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                <PenLine className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Journal</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60">{journals.length} entries</p>
              </div>
            </Link>
          </div>

          {/* Grouped Tasks Pulse */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Productivity Pulse</h2>
              </div>
              <Link href="/tasks" className="text-[10px] font-black uppercase tracking-widest text-emerald-500">View All</Link>
            </div>
            
            <div className="space-y-6">
              {groupedPendingTasks.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{group.name}</span>
                    <div className="h-[1px] flex-1 bg-black/[0.03] dark:bg-white/[0.03]" />
                  </div>
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-zinc-900 rounded-[24px] p-4 flex items-center gap-4 border border-zinc-100 dark:border-white/[0.05] shadow-sm group active:scale-[0.98] transition-all cursor-pointer"
                        onClick={() => {
                          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true, updatedAt: new Date().toISOString() } : t));
                          playSound('good');
                          showNow(`Task Completed!`, `"${task.name}" has been marked as done.`);
                        }}
                      >
                        <div className="h-6 w-6 rounded-full border-2 border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:border-emerald-500 transition-colors">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 scale-0 transition-transform group-active:scale-100" />
                        </div>
                        <p className="font-bold text-[15px] truncate flex-1">{task.name}</p>
                        {task.dueDate && isBefore(new Date(task.dueDate), startOfToday()) && (
                          <Clock className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {groupedPendingTasks.length === 0 && (
                <div className="py-10 text-center bg-zinc-50 dark:bg-white/5 rounded-[24px] border border-dashed border-zinc-200 dark:border-white/10">
                  <p className="text-xs font-bold opacity-30 italic">No pending tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Achievement Module */}
          <div className="p-6 rounded-[32px] bg-amber-500/5 border border-amber-500/10 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Growth Streak</p>
                <p className="text-[11px] font-bold text-amber-600/60 uppercase tracking-widest">{currentStreak} Days Consistent</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-900 border border-amber-500/20 flex items-center justify-center shadow-sm">
              <Flame className={cn("h-5 w-5", currentStreak > 0 ? "text-amber-500 animate-pulse" : "text-zinc-400 opacity-20")} />
            </div>
          </div>

          {/* Quote Footer */}
          <div className="pt-8 border-t border-zinc-100 dark:border-white/5 space-y-4">
            <div className="flex items-center gap-2 opacity-30">
              <Quote className="h-3 w-3 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Daily Insight</span>
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold italic leading-tight text-zinc-600 dark:text-zinc-400">
                "{dailyQuote.text}"
              </p>
              <p className="text-[11px] font-black uppercase tracking-widest opacity-40">— {dailyQuote.author}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
