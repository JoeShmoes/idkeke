
'use client';

import { 
    FolderArchive, 
    Users, 
    ClipboardCheck, 
    DollarSign, 
    TrendingUp, 
    Newspaper,
    Calendar,
    FileText,
    Target,
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/components/layout/app-provider';
import { useMemo } from 'react';
import FinanceOverviewChart from '@/components/dashboard/finance-overview-chart';
import SpendingCategoryChart from '@/components/dashboard/spending-category-chart';
import LatestNews from '@/components/dashboard/latest-news';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { useSound } from '@/hooks/use-sound';
import { useEffect } from 'react';


export default function DashboardPage() {













        const { 
        clients, 
        projects, 
        vaultFiles, 
        accounts, 
        appSettings, 
        userProfile,
        tasks,
        transactions,
        goals,
        activities,
        notes,
        loading
    } = useApp();

    const { playSound } = useSound();
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const played = sessionStorage.getItem('welcome_sound_played');
            if (!played) {
                playSound('welcome');
                sessionStorage.setItem('welcome_sound_played', 'true');
            }
        }
    }, [playSound]);

    if (loading) {
        return <div>Loading...</div>;
    }


    const activeProjects = useMemo(() => projects.filter(p => p.status === 'in-progress').length, [projects]);
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    const totalVaultSize = useMemo(() => vaultFiles.reduce((sum, file) => sum + file.size, 0), [vaultFiles]);
    const recentFiles = useMemo(() => vaultFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 5), [vaultFiles]);

    const netWorth = useMemo(() => accounts.reduce((sum, acc) => {
        if (acc.type === 'credit') {
            return sum - acc.balance;
        }
        return sum + acc.balance;
    }, 0), [accounts]);

    const recentTransactions = useMemo(() => transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), [transactions]);

    const upcomingTasks = useMemo(() => {
        const today = new Date();
        return tasks
            .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) >= today)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 5);
    }, [tasks]);

    const overdueTasks = useMemo(() => {
        const today = new Date();
        return tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < today);
    }, [tasks]);

    const recentNotes = useMemo(() => notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3), [notes]);

    const goalsProgress = useMemo(() => {
        return goals.map(goal => {
            const completedMilestones = goal.milestones.filter(m => m.completed).length;
            const progress = goal.milestones.length > 0 ? (completedMilestones / goal.milestones.length) * 100 : 0;
            return {
                ...goal,
                progress
            };
        }).slice(0, 3);
    }, [goals]);

    const recentActivities = useMemo(() => {
        const toTime = (d?: string) => d ? new Date(d).getTime() : 0;
        return activities
            .slice()
            .sort((a, b) => toTime(b.date) - toTime(a.date))
            .slice(0, 5);
    }, [activities]);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'MMM dd');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="backdrop-blur-xl bg-card/70 rounded-2xl p-8 shadow-lg border border-border/20">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                            {format(new Date(), 'EEEE, MMMM do, yyyy')}
                        </p>
                    </div>
                </div>

                {/* Key Metrics Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="backdrop-blur-xl bg-card/60 rounded-2xl p-6 shadow-xl border border-border/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                                <p className="text-3xl font-light text-foreground">{clients.length}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/80 to-primary rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-card/60 rounded-2xl p-6 shadow-xl border border-border/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                                <p className="text-3xl font-light text-foreground">{activeProjects}</p>
                                <p className="text-xs text-muted-foreground">of {totalProjects} total</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-chart-2/80 to-chart-2 rounded-2xl flex items-center justify-center shadow-lg">
                                <ClipboardCheck className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-card/60 rounded-2xl p-6 shadow-xl border border-border/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
                                <p className="text-3xl font-light text-foreground">
                                    {formatCurrency(netWorth)}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-chart-3/80 to-chart-3 rounded-2xl flex items-center justify-center shadow-lg">
                                <DollarSign className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-card/60 rounded-2xl p-6 shadow-xl border border-border/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Vault Storage</p>
                                <p className="text-3xl font-light text-foreground">{formatBytes(totalVaultSize)}</p>
                                <p className="text-xs text-muted-foreground">{vaultFiles.length} files</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-chart-4/80 to-chart-4 rounded-2xl flex items-center justify-center shadow-lg">
                                <FolderArchive className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                    </div>
                </div>










































                                {/* Quick Actions */}
                <div className="backdrop-blur-xl bg-card/60 rounded-2xl p-6 shadow-xl border border-border/30">
                    <div className="space-y-4">
                        <h2 className="text-xl font-light text-foreground">Quick Actions</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2 bg-card/50 border-border/30 hover:bg-accent/50 transition-all duration-200"
                                onClick={() => window.location.href = '/clients'}
                            >
                                <Users className="h-6 w-6" />
                                <span className="text-sm">Add Client</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2 bg-card/50 border-border/30 hover:bg-accent/50 transition-all duration-200"
                                onClick={() => window.location.href = '/projects'}
                            >
                                <ClipboardCheck className="h-6 w-6" />
                                <span className="text-sm">New Project</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2 bg-card/50 border-border/30 hover:bg-accent/50 transition-all duration-200"
                                onClick={() => window.location.href = '/tasks'}
                            >
                                <CheckCircle className="h-6 w-6" />
                                <span className="text-sm">Add Task</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2 bg-card/50 border-border/30 hover:bg-accent/50 transition-all duration-200"
                                onClick={() => window.location.href = '/vilefault'}
                            >
                                <FolderArchive className="h-6 w-6" />
                                <span className="text-sm">Upload File</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Financial Overview and News */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 bg-background rounded-lg p-2">
                        <FinanceOverviewChart />
                    </div>
                    <div>
                        <Card className="bg-card/50">
                            <CardHeader>
                                <CardTitle>Latest News</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <LatestNews />
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
