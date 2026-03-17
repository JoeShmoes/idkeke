'use client';

import { 
    FolderArchive, 
    Users, 
    DollarSign, 
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    ArrowRight,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useApp } from '@/components/layout/app-provider';
import { useMemo, useEffect, useState } from 'react';
import FinanceOverviewChart from '@/components/dashboard/finance-overview-chart';
import { format, isToday, isPast } from 'date-fns';
import { useSound } from '@/hooks/use-sound';
import { cn, copyToClipboard } from '@/lib/utils';
import Link from 'next/link';
import LiveClock from '@/components/dashboard/clock';

export default function DashboardPage() {
    const { 
        clients, 
        projects, 
        vaultFiles, 
        accounts, 
        appSettings, 
        userProfile,
        tasks,
        taskGroups,
        loading
    } = useApp();

    const { playSound } = useSound();
    const [greeting, setGreeting] = useState('Welcome back');
    const [projectPage, setProjectPage] = useState(0);
    const [filePage, setFilePage] = useState(0);
    const [taskPage, setTaskPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const privacyClass = appSettings.finance.privacyMode ? 'blur-md select-none' : '';
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const played = sessionStorage.getItem('welcome_sound_played');
            if (!played) {
                playSound('welcome');
                sessionStorage.setItem('welcome_sound_played', 'true');
            }
        }
        
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, [playSound]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        );
    }

    // Metrics
    const activeProjects = useMemo(() => projects.filter(p => p.status === 'in-progress'), [projects]);
    
    const recentFiles = useMemo(() => [...vaultFiles].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()), [vaultFiles]);

    const paginatedProjects = useMemo(() => activeProjects.slice(projectPage * ITEMS_PER_PAGE, (projectPage + 1) * ITEMS_PER_PAGE), [activeProjects, projectPage]);
    const paginatedFiles = useMemo(() => recentFiles.slice(filePage * ITEMS_PER_PAGE, (filePage + 1) * ITEMS_PER_PAGE), [recentFiles, filePage]);

    const netWorth = useMemo(() => accounts.reduce((sum, acc) => {
        if (acc.type === 'credit') return sum - acc.balance;
        return sum + acc.balance;
    }, 0), [accounts]);

    // Tasks Logic
    const upcomingTasks = useMemo(() => {
        return tasks
            .filter(task => !task.completed)
            .sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
    }, [tasks]);

    const paginatedTasks = useMemo(() => upcomingTasks.slice(taskPage * ITEMS_PER_PAGE, (taskPage + 1) * ITEMS_PER_PAGE), [upcomingTasks, taskPage]);

    // Formatters
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pb-10 md:pb-12 flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-light tracking-tight">
                        {greeting}, <span className="font-medium">{userProfile.name || 'User'}</span>
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <LiveClock />
                        <span className="text-border">|</span>
                        <span>{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.location.href = '/tasks'} variant="outline" size="sm" className="hidden md:flex h-8 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        My Tasks
                    </Button>
                    <Button onClick={() => window.location.href = '/calendar'} variant="default" size="sm" className="h-8 text-xs">
                        <CalendarIcon className="w-3 h-3 mr-2" />
                        Schedule
                    </Button>
                </div>
            </div>

            {/* Main Grid Content - Scrollable */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left Column (Stats, Charts, Projects/Files) - Spans 9 cols */}
                <div className="xl:col-span-9 flex flex-col gap-6">
                    
                    {/* Stats Row - Fixed Height */}
                    <div className="flex-none grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Net Worth</p>
                                        <h3 className={cn("text-xl font-bold mt-1", privacyClass)}>{formatCurrency(netWorth)}</h3>
                                    </div>
                                    <div className="p-1.5 bg-primary/10 rounded-full text-primary">
                                        <DollarSign className="w-3 h-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Active Projects</p>
                                        <h3 className="text-xl font-bold mt-1">{activeProjects.length}</h3>
                                    </div>
                                    <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-500">
                                        <Briefcase className="w-3 h-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Pending Tasks</p>
                                        <h3 className="text-xl font-bold mt-1">{tasks.filter(t => !t.completed).length}</h3>
                                    </div>
                                    <div className="p-1.5 bg-orange-500/10 rounded-full text-orange-500">
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Clients</p>
                                        <h3 className="text-xl font-bold mt-1">{clients.length}</h3>
                                    </div>
                                    <div className="p-1.5 bg-purple-500/10 rounded-full text-purple-500">
                                        <Users className="w-3 h-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Finance Chart - Fixed Large Height */}
                    <div className="h-[350px]">
                        <Card className="bg-card border-border/50 shadow-sm h-full flex flex-col">
                            <CardContent className="flex-1 min-h-0 p-4">
                                <FinanceOverviewChart />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row (Projects & Files) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Projects */}
                        <Card className="bg-card border-border/50 shadow-sm flex flex-col">
                            <CardHeader className="flex-none py-3 px-4">
                                <CardTitle className="text-base font-medium flex items-center justify-between">
                                    Active Projects
                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                        <Link href="/projects"><ArrowRight className="w-3 h-3" /></Link>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 p-0">
                                <div className="px-4 pb-4">
                                    <div className="space-y-3 pt-2">
                                        {paginatedProjects.map(project => (
                                            <ContextMenu key={project.id}>
                                                <ContextMenuTrigger>
                                                    <div className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                            <div className="space-y-0.5 min-w-0">
                                                                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors truncate">{project.title}</p>
                                                                <p className="text-[10px] text-muted-foreground">{project.clientName || 'Internal'}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px] h-5">{project.priority}</Badge>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                                                    <ContextMenuItem onClick={() => {
                                                        window.location.href = '/projects';
                                                    }}>
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Go to Projects
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        ))}
                                        {activeProjects.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-8">No active projects</p>
                                        )}
                                    </div>
                                </div>
                                {activeProjects.length > ITEMS_PER_PAGE && (
                                    <div className="flex items-center justify-between p-2 px-4 border-t text-xs text-muted-foreground">
                                        <span>{projectPage * ITEMS_PER_PAGE + 1}-{Math.min((projectPage + 1) * ITEMS_PER_PAGE, activeProjects.length)} of {activeProjects.length}</span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProjectPage(p => Math.max(0, p - 1))} disabled={projectPage === 0}>
                                                <ChevronLeft className="h-3 w-3"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProjectPage(p => p + 1)} disabled={(projectPage + 1) * ITEMS_PER_PAGE >= activeProjects.length}>
                                                <ChevronRight className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Files */}
                        <Card className="bg-card border-border/50 shadow-sm flex flex-col">
                            <CardHeader className="flex-none py-3 px-4">
                                <CardTitle className="text-base font-medium flex items-center justify-between">
                                    Recent Files
                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                        <Link href="/file-vault"><ArrowRight className="w-3 h-3" /></Link>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 p-0">
                                <div className="px-4 pb-4">
                                    <div className="space-y-3 pt-2">
                                        {paginatedFiles.map(file => (
                                            <ContextMenu key={file.id}>
                                                <ContextMenuTrigger>
                                                    <div className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                                            <div className="p-1.5 bg-muted rounded-md group-hover:bg-primary/10 transition-colors flex-none">
                                                                <FolderArchive className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                                                            </div>
                                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                                <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">{file.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-none">
                                                            {format(new Date(file.uploadedAt), 'MMM d')}
                                                        </span>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                                                    <ContextMenuItem onClick={() => {
                                                        window.location.href = '/file-vault';
                                                    }}>
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Go to File Vault
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        ))}
                                        {recentFiles.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-8">No files uploaded</p>
                                        )}
                                    </div>
                                </div>
                                {recentFiles.length > ITEMS_PER_PAGE && (
                                    <div className="flex items-center justify-between p-2 px-4 border-t text-xs text-muted-foreground">
                                        <span>{filePage * ITEMS_PER_PAGE + 1}-{Math.min((filePage + 1) * ITEMS_PER_PAGE, recentFiles.length)} of {recentFiles.length}</span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilePage(p => Math.max(0, p - 1))} disabled={filePage === 0}>
                                                <ChevronLeft className="h-3 w-3"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilePage(p => p + 1)} disabled={(filePage + 1) * ITEMS_PER_PAGE >= recentFiles.length}>
                                                <ChevronRight className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* Right Column (Quick Actions & Tasks) - Spans 3 cols */}
                <div className="md:col-span-3 flex flex-col gap-4 min-h-0">
                    
                    {/* Quick Actions */}
                    <Card className="flex-none bg-gradient-to-br from-primary/5 via-card to-card border-border/50 shadow-sm">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2 p-3 pt-0">
                            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/20 transition-all" onClick={() => window.location.href = '/tasks'}>
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px]">Add Task</span>
                            </Button>
                            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/20 transition-all" onClick={() => window.location.href = '/calendar'}>
                                <CalendarIcon className="w-4 h-4" />
                                <span className="text-[10px]">Event</span>
                            </Button>
                            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/20 transition-all" onClick={() => window.location.href = '/clients'}>
                                <Users className="w-4 h-4" />
                                <span className="text-[10px]">Client</span>
                            </Button>
                            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/20 transition-all" onClick={() => window.location.href = '/file-vault'}>
                                <FolderArchive className="w-4 h-4" />
                                <span className="text-[10px]">Upload</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Upcoming Tasks - Fills remaining height */}
                    <Card className="bg-card border-border/50 shadow-sm flex flex-col">
                        <CardHeader className="flex-none py-3 px-4">
                            <CardTitle className="text-base font-medium flex items-center justify-between">
                                Upcoming Tasks
                                <Badge variant="secondary" className="font-normal text-[8px] h-4 px-1.5 whitespace-nowrap">{tasks.filter(t => !t.completed).length} pending</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0">
                            <div className="px-4 pb-4">
                                <div className="space-y-3 pt-2">
                                    {paginatedTasks.map(task => {
                                        const group = taskGroups.find(g => g.id === task.groupId);
                                        return (
                                            <ContextMenu key={task.id}>
                                                <ContextMenuTrigger>
                                                    <div className="flex items-start gap-3 group p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer w-full">
                                                        <div className="mt-1.5 flex-none">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${(task as any).priority === 'high' ? 'bg-red-500' : (task as any).priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                                        </div>
                                                        <div className="flex-1 space-y-1 min-w-0 w-full">
                                                            <p className="text-sm font-medium leading-none text-foreground group-hover:text-primary transition-colors truncate w-full">
                                                                {task.name || 'Untitled Task'}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                {task.dueDate && (
                                                                    <span className={isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) ? "text-red-400" : ""}>
                                                                        {format(new Date(task.dueDate), 'MMM d')}
                                                                    </span>
                                                                )}
                                                                {group && <span className="truncate max-w-[120px]">• {group.name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                                                    <ContextMenuItem onClick={() => {
                                                        window.location.href = '/tasks';
                                                    }}>
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Go to Tasks
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        );
                                    })}
                                    {upcomingTasks.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-8">No upcoming tasks</p>
                                    )}
                                </div>
                            </div>
                            {upcomingTasks.length > ITEMS_PER_PAGE && (
                                <div className="flex items-center justify-between p-2 px-4 border-t text-xs text-muted-foreground">
                                    <span>{taskPage * ITEMS_PER_PAGE + 1}-{Math.min((taskPage + 1) * ITEMS_PER_PAGE, upcomingTasks.length)} of {upcomingTasks.length}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTaskPage(p => Math.max(0, p - 1))} disabled={taskPage === 0}>
                                            <ChevronLeft className="h-3 w-3"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTaskPage(p => p + 1)} disabled={(taskPage + 1) * ITEMS_PER_PAGE >= upcomingTasks.length}>
                                            <ChevronRight className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
