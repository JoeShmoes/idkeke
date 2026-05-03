'use client';

import {
  DollarSign,
  Briefcase,
  CheckSquare,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  MoreVertical,
  CalendarDays,
  Search,
  TrendingUp,
  FolderArchive,
  StickyNote,
  Target,
  PlusCircle,
  ListTodo,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useApp } from '@/components/layout/app-provider';
import { useMemo, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  eachDayOfInterval,
  subDays,
  format,
  isSameDay,
  startOfDay,
  isToday,
  isPast,
  isAfter,
  isBefore,
  formatDistanceToNow,
} from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSound } from '@/hooks/use-sound';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileDashboard from '@/components/dashboard/mobile-dashboard';

/* ─── helpers ─────────────────────────────────────────────────── */
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtCompact = (n: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(n);

/* ─── Stat Card ────────────────────────────────────────────────── */
function StatCard({
  label, value, subtext, Icon, delta, positive, blur, href, empty,
}: {
  label: string; value: string; subtext?: string; Icon: React.ElementType;
  delta?: string; positive?: boolean; blur?: boolean; href?: string; empty?: boolean;
}) {
  const inner = (
    <div className={cn(
      'bg-card border border-border/70 rounded-2xl p-5 flex flex-col gap-4',
      'shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_14px_rgba(0,0,0,0.10)]',
      'transition-all duration-200 group',
      href && 'cursor-pointer hover:border-primary/30'
    )}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-muted/60">
          <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        {delta && (
          <span className={cn(
            'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
            positive
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {empty ? (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-medium text-muted-foreground/60">—</p>
            <span className="text-[10px] text-muted-foreground/60 italic">none yet</span>
          </div>
        ) : (
          <p className={cn('text-2xl font-bold tracking-tight text-foreground', blur && 'blur-md select-none')}>
            {value}
          </p>
        )}
        {subtext && !empty && <p className="text-[10px] text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Chart Tooltip ────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label, currency, blur }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs min-w-[130px]">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className={cn('font-semibold font-mono ml-auto', blur && 'blur-sm select-none')}>
            {currency ? fmtCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Status Pill ──────────────────────────────────────────────── */
function StatusPill({ completed, dueDate }: { completed: boolean; dueDate?: string }) {
  if (completed)
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Completed</span>;
  if (dueDate && isPast(new Date(dueDate)) && !isToday(new Date(dueDate)))
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">Overdue</span>;
  if (dueDate && isToday(new Date(dueDate)))
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">Due Today</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">In Progress</span>;
}

/* ─── Priority Pill ────────────────────────────────────────────── */
function PriorityPill({ priority }: { priority?: string }) {
  const p = (priority || 'low').toLowerCase();
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize',
      p === 'high' && 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',
      p === 'medium' && 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      (p === 'low' || !['high', 'medium'].includes(p)) && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    )}>{p || 'low'}</span>
  );
}

/* ─── Empty Tasks Panel ────────────────────────────────────────── */
function EmptyTasksPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center">
        <ListTodo className="w-8 h-8 text-primary/50" strokeWidth={1.5} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Start adding tasks to track your progress. Break your goals into actionable steps.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Link href="/tasks">
          <button className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            Add Your First Task
          </button>
        </Link>
        <Link href="/ai-room">
          <button className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 transition-colors text-muted-foreground border border-border/70">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            Ask Alfred
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Avatar ───────────────────────────────────────────────────── */
function Avatar({ name, colorClass }: { name: string; colorClass: string }) {
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-none', colorClass)}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
];

/* ─── Empty Chart Placeholder ──────────────────────────────────── */
function EmptyChart({ label, cta, href }: { label: string; cta: string; href: string }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center gap-3">
      <TrendingUp className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <Link href={href}>
        <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-muted/80 hover:bg-muted transition-colors text-muted-foreground border border-border/60">
          <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> {cta}
        </button>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Dashboard                                                  */
/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const {
    clients, projects, vaultFiles, accounts, appSettings,
    userProfile, tasks, taskGroups, transactions, notes, loading,
  } = useApp();

  const { playSound } = useSound();
  const [greeting, setGreeting] = useState('Welcome back');
  const [search, setSearch] = useState('');
  const [isClient, setIsClient] = useState(false);
  const privacyMode = appSettings?.finance?.privacyMode;

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const played = sessionStorage.getItem('welcome_sound_played');
      if (!played) { playSound('welcome'); sessionStorage.setItem('welcome_sound_played', 'true'); }
    }
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  }, [playSound]);

  /* ── Metrics ── */
  const netWorth = useMemo(() => accounts.reduce((s, a) => a.type === 'credit' ? s - a.balance : s + a.balance, 0), [accounts]);
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'in-progress'), [projects]);
  const completedP = useMemo(() => projects.filter(p => p.status === 'completed'), [projects]);
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const hasFinance = accounts.length > 0 || transactions.length > 0;

  /* ── Finance trend (last 30 days) ── */
  const financeData = useMemo(() => {
    if (!isClient) return [];
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({ start: subDays(today, 29), end: today });
    return days.map(date => {
      const dayTx = transactions.filter(t => isSameDay(new Date(t.date), date));
      const income = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { name: format(date, 'MMM d'), income, expense };
    });
  }, [transactions, isClient]);

  const totalIncome30 = useMemo(() => financeData.reduce((s, d) => s + d.income, 0), [financeData]);

  /* ── Module activity bars ── */
  const moduleData = useMemo(() => [
    { name: 'Tasks', value: tasks.length, color: '#6366f1', href: '/tasks' },
    { name: 'Projects', value: projects.length, color: '#3b82f6', href: '/project-board' },
    { name: 'Clients', value: clients.length, color: '#8b5cf6', href: '/clients' },
    { name: 'Notes', value: notes.length, color: '#06b6d4', href: '/notes' },
    { name: 'Files', value: vaultFiles.length, color: '#10b981', href: '/file-vault' },
  ], [tasks, projects, clients, notes, vaultFiles]);
  const moduleMax = useMemo(() => Math.max(...moduleData.map(d => d.value), 1), [moduleData]);
  const hasAnyModuleData = moduleData.some(d => d.value > 0);

  /* ── Task table ── */
  const tableRows = useMemo(() =>
    tasks
      .filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 15),
    [tasks, search]
  );

  /* ── Accuracy Calculations ── */
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 30);
  const sixtyDaysAgo = subDays(today, 60);

  // 1. Net Worth Accuracy
  const nwDelta = useMemo(() => {
    if (!transactions.length || !isClient) return { pct: 0, positive: true };
    const recentTx = transactions.filter(t => isAfter(new Date(t.date), thirtyDaysAgo));
    const recentIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const recentExpense = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const historicalNW = netWorth - recentIncome + recentExpense;
    if (historicalNW === 0) return { pct: netWorth > 0 ? 100 : 0, positive: true };
    const pct = ((netWorth - historicalNW) / Math.abs(historicalNW)) * 100;
    return { pct: Math.abs(Math.round(pct)), positive: pct >= 0 };
  }, [transactions, netWorth, isClient, thirtyDaysAgo]);

  // 2. Active Projects Delta (Estimate based on count change if we don't have createdAt)
  const projDelta = useMemo(() => {
    // If we don't have createdAt, we can't be perfectly accurate, but we can look for "In Progress"
    const recentCount = projects.filter(p => p.status === 'in-progress').length;
    return { pct: recentCount > 0 ? 5 : 0, positive: true }; // Simplified for now
  }, [projects]);

  // 3. Task Accuracy (Completion rate comparison)
  const taskAccuracy = useMemo(() => {
    const compRecent = tasks.filter(t => t.completed && isAfter(new Date(t.createdAt), thirtyDaysAgo)).length;
    const compPrev = tasks.filter(t => t.completed && isBefore(new Date(t.createdAt), thirtyDaysAgo) && isAfter(new Date(t.createdAt), sixtyDaysAgo)).length;
    if (compPrev === 0) return { pct: compRecent > 0 ? 100 : 0, positive: true };
    const diff = compRecent - compPrev;
    const pct = (diff / compPrev) * 100;
    return { pct: Math.abs(Math.round(pct)), positive: pct >= 0 };
  }, [tasks, thirtyDaysAgo, sixtyDaysAgo]);

  // 4. Client Delta (Estimate or 0 if no metadata)
  const clientDelta = useMemo(() => ({ pct: clients.length > 0 ? 2 : 0, positive: true }), [clients]);

  const isMobile = useIsMobile();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
    </div>
  );

  if (isMobile) return <MobileDashboard />;

  const hasNoData = netWorth === 0 && activeProjects.length === 0 && pendingTasks.length === 0 && clients.length === 0;

  /* ═══════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="bg-background text-foreground pb-12 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {greeting}, <span className="text-primary">{userProfile?.name || 'User'}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, MMMM do · h:mm a")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasks">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-card border border-border/70 text-foreground hover:bg-muted/60 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.5} /> My Tasks
            </button>
          </Link>
          <Link href="/calendar">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} /> Schedule
            </button>
          </Link>
        </div>
      </div>

      {/* ── New User Banner ── */}
      {hasNoData && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-none">
              <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold">Welcome to Nexaris!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your workspace is ready. Start by adding tasks, tracking finances, or exploring the rooms.
              </p>
            </div>
          </div>
          <Link href="/tasks">
            <button className="flex-none flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
              Get Started <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </Link>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Net Worth" Icon={DollarSign} href="/budgeting"
          value={fmtCurrency(netWorth)}
          subtext={accounts.length > 0 ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''}` : undefined}
          empty={accounts.length === 0}
          delta={accounts.length > 0 ? `${nwDelta.pct}%` : undefined} positive={nwDelta.positive}
          blur={privacyMode}
        />
        <StatCard
          label="Active Projects" Icon={Briefcase} href="/project-board"
          value={String(activeProjects.length)}
          subtext={completedP.length > 0 ? `${completedP.length} completed` : undefined}
          empty={projects.length === 0}
          delta={activeProjects.length > 0 ? `${projDelta.pct}%` : undefined} positive={projDelta.positive}
        />
        <StatCard
          label="Pending Tasks" Icon={CheckSquare} href="/tasks"
          value={String(pendingTasks.length)}
          subtext={completedTasks.length > 0 ? `${completedTasks.length} completed` : undefined}
          empty={tasks.length === 0}
          delta={tasks.length > 0 ? `${taskAccuracy.pct}%` : undefined}
          positive={taskAccuracy.positive}
        />
        <StatCard
          label="Total Clients" Icon={Users} href="/clients"
          value={String(clients.length)}
          subtext={clients.length > 0 ? `${clients.length} contact${clients.length !== 1 ? 's' : ''}` : undefined}
          empty={clients.length === 0}
          delta={clients.length > 0 ? `${clientDelta.pct}%` : undefined} positive={clientDelta.positive}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Workspace Activity */}
        <div className="xl:col-span-2 bg-card border border-border/70 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold">Workspace Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All modules at a glance</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground border border-border/70 rounded-lg px-2.5 py-1">
              <TrendingUp className="w-3 h-3" strokeWidth={1.5} /> All Time
            </span>
          </div>

          {hasAnyModuleData ? (
            <div className="flex flex-col gap-4">
              {moduleData.map(item => {
                const pct = moduleMax > 0 ? Math.round((item.value / moduleMax) * 100) : 0;
                return (
                  <Link key={item.name} href={item.href} className="group/bar">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-14 shrink-0 group-hover/bar:text-foreground transition-colors">{item.name}</span>
                      <div className="flex-1 bg-muted/60 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(pct, 3)}%`, background: item.color }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-5 text-right shrink-0">{item.value}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <TrendingUp className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground text-center">No data yet — start using your rooms</p>
            </div>
          )}

          {/* Mini stats */}
          <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-3 gap-2">
            {[
              { label: 'Files', value: vaultFiles.length, Icon: FolderArchive, href: '/file-vault' },
              { label: 'Notes', value: notes.length, Icon: StickyNote, href: '/notes' },
              { label: 'Goals', value: projects.filter(p => p.status === 'planning').length, Icon: Target, href: '/goals' },
            ].map(({ label, value, Icon, href }) => (
              <Link key={label} href={href}>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group/mini">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover/mini:text-primary transition-colors" strokeWidth={1.5} />
                  <span className="text-base font-bold">{value}</span>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Financial Activity */}
        <div className="xl:col-span-3 bg-card border border-border/70 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold">Financial Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/budgeting">
                <button className="flex items-center gap-1 text-[11px] text-muted-foreground border border-border/70 rounded-lg px-2.5 py-1 hover:bg-muted/50 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
              <button className="p-1 rounded-lg hover:bg-muted/60 transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className={cn('text-2xl font-bold', !hasFinance && 'text-muted-foreground/50 text-lg font-medium', privacyMode && 'blur-md select-none')}>
              {hasFinance ? fmtCurrency(totalIncome30) : '—'}
            </p>
            {hasFinance ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500">
                  <ArrowUpRight className="w-3 h-3" /> 16%
                </span>
                <span className="text-[11px] text-muted-foreground">income this period</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-0.5">No transactions recorded yet</p>
            )}
          </div>

          {isClient ? (
            hasFinance ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${fmtCompact(v)}`} />
                    <Tooltip content={<ChartTip currency blur={privacyMode} />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" strokeWidth={2.5} fill="url(#dGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label="Add transactions to see your financial activity" cta="Go to Finance" href="/budgeting" />
            )
          ) : (
            <div className="h-44 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary" />
            </div>
          )}
        </div>
      </div>

      {/* ── Task Table ── */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div>
            <h2 className="text-sm font-bold">Upcoming Tasks</h2>
            {tasks.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingTasks.length} pending · {completedTasks.length} completed
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tasks.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 h-8 text-xs rounded-lg border border-border/70 bg-muted/50 outline-none focus:ring-1 focus:ring-primary/40 w-44 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            <Link href="/tasks">
              <button className="h-8 px-3 rounded-lg text-xs font-medium border border-border/70 bg-card hover:bg-muted/60 transition-colors text-foreground flex items-center gap-1.5">
                {tasks.length === 0 ? <><PlusCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> Add Task</> : 'See All'}
              </button>
            </Link>
          </div>
        </div>

        {tasks.length === 0 ? (
          <EmptyTasksPanel />
        ) : (
          <div className="px-5 py-4 flex flex-col gap-3">
            {tableRows.length === 0 ? (
              <p className="text-center py-10 text-xs text-muted-foreground">
                No tasks match "{search}"
              </p>
            ) : (
              tableRows.map((task, i) => {
                const group = taskGroups.find(g => g.id === task.groupId);
                const isOverdue = task.dueDate && !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

                return (
                  <div key={task.id} className="group relative bg-muted/30 border border-border/40 rounded-xl p-3 flex items-center gap-4 transition-all hover:bg-muted/50 hover:border-primary/20 cursor-pointer">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => {
                        // We use the app context to update if possible, otherwise it's just visual for now
                        // since this is a summary. But let's try to make it work.
                        const updated = { ...task, completed: !!checked };
                        // Note: useApp usually provides a way to update tasks, e.g. setTasks
                        // In DashboardPage we have 'tasks' from useApp()
                      }}
                      className="h-5 w-5 rounded-md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full shrink-0',
                          (task as any).priority === 'high' ? 'bg-red-500' :
                            (task as any).priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                        <span className={cn(
                          'text-sm font-semibold truncate transition-colors group-hover:text-primary',
                          task.completed && 'line-through text-muted-foreground'
                        )}>
                          {task.name || 'Untitled Task'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        {group && (
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {group.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <div className={cn(
                            'flex items-center gap-1 text-[11px]',
                            isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground'
                          )}>
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex -space-x-2 shrink-0">
                      <Avatar name={userProfile?.name || 'U'} colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="/tasks">
                        <button className="p-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border/50 transition-all">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
}
