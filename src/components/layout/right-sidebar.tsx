
'use client';

import { useMemo } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Landmark, Notebook, UserPlus, ClipboardCheck, Bell, AlertTriangle,
    Target, DollarSign, BookOpen, Network, Building, TrendingDown,
    Calendar, FileText, HeartPulse, Search, Award, X
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import GoogleAdBanner from '../shared/google-ad-banner';
import { formatDistanceToNow, isBefore, isToday, startOfToday, addDays, differenceInDays, isAfter } from 'date-fns';


interface ActivityItem {
    id: string;
    type: 'Task' | 'Project' | 'Client' | 'Transaction' | 'Note' | 'Note' | 'Notification' | 'Goal' | 'Account' | 'Learning' | 'Network' | 'Asset' | 'Research';
    icon: React.ElementType;
    title: string;
    description: string;
    timestamp: string;
    priority?: 'high' | 'medium' | 'low';
}


export default function RightSidebar() {
    const {
        projects, clients, transactions, networkContacts, appSettings, tasks,
        accounts, goals, learningResources, researchSessions, assets, toggleRightSidebar
    } = useApp();

    const activityFeed: ActivityItem[] = useMemo(() => {
        const today = startOfToday();

        const getTimestampFromId = (id: string): string => {
            const timestamp = parseInt(id.split('-')[1]);
            return isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString();
        };

        const projectActivities = Array.isArray(projects) ? projects.map(p => ({
            id: `proj-${p.id}`, type: 'Project' as const, icon: ClipboardCheck,
            title: `Project: ${p.name}`, description: `Status set to ${p.status}`,
            timestamp: getTimestampFromId(p.id)
        })) : [];

        const clientActivities = Array.isArray(clients) ? clients.map(c => ({
            id: `client-${c.id}`, type: 'Client' as const, icon: UserPlus,
            title: `Client: ${c.name}`, description: `Added as a new ${c.status}`,
            timestamp: getTimestampFromId(c.id)
        })) : [];

        const transactionActivities = Array.isArray(transactions) ? transactions.map(t => ({
            id: `trans-${t.id}`, type: 'Transaction' as const, icon: Landmark,
            title: `${t.type === 'income' ? 'Income' : 'Expense'}: $${t.amount.toFixed(2)}`,
            description: t.description,
            timestamp: t.date
        })) : [];

        return [...projectActivities, ...clientActivities, ...transactionActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

    }, [projects, clients, transactions]);

    const notifications: ActivityItem[] = useMemo(() => {
        const today = startOfToday();
        const todayDay = new Date().toLocaleString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
        const allNotifications: ActivityItem[] = [];

        // Task notifications - overdue and due today
        if (Array.isArray(tasks)) {
            tasks.filter(task => {
                if (task.completed) return false;
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    return isBefore(dueDate, today) || isToday(dueDate);
                }
                const isRepeatingToday = task.repeat && (task.repeat.everyday || task.repeat[todayDay]);
                return isRepeatingToday;
            }).forEach(t => {
                const dueDate = t.dueDate ? new Date(t.dueDate) : today;
                const overdue = isBefore(dueDate, today);
                allNotifications.push({
                    id: `task-notif-${t.id}`,
                    type: 'Notification' as const,
                    icon: AlertTriangle,
                    title: `${overdue ? 'Overdue' : 'Due Today'}: ${t.name}`,
                    description: `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`,
                    timestamp: dueDate.toISOString(),
                    priority: overdue ? 'high' : 'medium'
                });
            });
        }

        // Goal notifications - approaching target dates
        if (Array.isArray(goals)) {
            goals.filter(goal => (goal.status as any) !== 'completed').forEach(goal => {
                const targetDate = new Date(goal.targetDate);
                const daysUntil = differenceInDays(targetDate, today);

                if (daysUntil <= 7 && daysUntil >= 0) {
                    allNotifications.push({
                        id: `goal-notif-${goal.id}`,
                        type: 'Goal' as const,
                        icon: Target,
                        title: `Goal Deadline Approaching: ${goal.title}`,
                        description: `${daysUntil === 0 ? 'Due today' : `${daysUntil} day${daysUntil > 1 ? 's' : ''} remaining`}`,
                        timestamp: goal.targetDate,
                        priority: daysUntil <= 3 ? 'high' : 'medium'
                    });
                } else if (isBefore(targetDate, today)) {
                    allNotifications.push({
                        id: `goal-overdue-${goal.id}`,
                        type: 'Goal' as const,
                        icon: AlertTriangle,
                        title: `Overdue Goal: ${goal.title}`,
                        description: `Target date was ${formatDistanceToNow(targetDate, { addSuffix: true })}`,
                        timestamp: goal.targetDate,
                        priority: 'high'
                    });
                }
            });
        }

        // Account notifications - low balance warnings
        if (Array.isArray(accounts) && appSettings?.finance?.lowBalanceThreshold) {
            accounts.forEach(account => {
                if (account.type !== 'credit' && account.balance < appSettings.finance.lowBalanceThreshold) {
                    allNotifications.push({
                        id: `account-low-${account.id}`,
                        type: 'Account' as const,
                        icon: TrendingDown,
                        title: `Low Balance: ${account.name}`,
                        description: `Balance: $${account.balance.toFixed(2)} (below $${appSettings.finance.lowBalanceThreshold})`,
                        timestamp: new Date().toISOString(),
                        priority: 'high'
                    });
                }
            });
        }

        // Project notifications - status changes and long-running projects
        if (Array.isArray(projects)) {
            projects.forEach(project => {
                if (project.status === 'in-progress') {
                    // Check if project has been in progress for a while (using ID timestamp as proxy)
                    const projectDate = new Date(parseInt(project.id.split('-')[1]) || Date.now());
                    const daysInProgress = differenceInDays(today, projectDate);

                    if (daysInProgress >= 30) {
                        allNotifications.push({
                            id: `project-long-${project.id}`,
                            type: 'Project' as const,
                            icon: ClipboardCheck,
                            title: `Long-Running Project: ${project.name}`,
                            description: `In progress for ${daysInProgress} days - consider reviewing`,
                            timestamp: projectDate.toISOString(),
                            priority: 'low'
                        });
                    }
                }
            });
        }

        // Client notifications - follow-up reminders
        if (Array.isArray(clients)) {
            clients.filter(client => client.status === 'lead' || client.status === 'active').forEach(client => {
                if (client.lastInteraction) {
                    const lastContact = new Date(client.lastInteraction);
                    const daysSinceContact = differenceInDays(today, lastContact);

                    if (daysSinceContact >= 14 && daysSinceContact <= 30) {
                        allNotifications.push({
                            id: `client-followup-${client.id}`,
                            type: 'Client' as const,
                            icon: UserPlus,
                            title: `Follow-up Needed: ${client.name}`,
                            description: `Last contacted ${formatDistanceToNow(lastContact, { addSuffix: true })}`,
                            timestamp: client.lastInteraction,
                            priority: 'medium'
                        });
                    }
                }
            });
        }

        // Network contact notifications - follow-up reminders
        if (Array.isArray(networkContacts)) {
            networkContacts.forEach(contact => {
                if (contact.lastContacted) {
                    const lastContact = new Date(contact.lastContacted);
                    const daysSinceContact = differenceInDays(today, lastContact);

                    if (daysSinceContact >= 30 && daysSinceContact <= 60) {
                        allNotifications.push({
                            id: `network-followup-${contact.id}`,
                            type: 'Network' as const,
                            icon: Network,
                            title: `Network Follow-up: ${contact.name}`,
                            description: `Last contacted ${formatDistanceToNow(lastContact, { addSuffix: true })}`,
                            timestamp: contact.lastContacted,
                            priority: 'low'
                        });
                    }
                }
            });
        }

        // Learning resource notifications - incomplete resources
        if (Array.isArray(learningResources)) {
            const incompleteResources = learningResources.filter(r => (r.status as any) === 'in-progress' || (r.status as any) === 'planned');
            if (incompleteResources.length > 0) {
                incompleteResources.slice(0, 3).forEach(resource => {
                    allNotifications.push({
                        id: `learning-incomplete-${resource.id}`,
                        type: 'Learning' as const,
                        icon: BookOpen,
                        title: `Incomplete Learning: ${resource.title}`,
                        description: `Status: ${resource.status === 'in-progress' ? 'In Progress' : 'Planned'}`,
                        timestamp: resource.createdAt,
                        priority: 'low'
                    });
                });
            }
        }

        // Transaction notifications - large transactions (recent)
        if (Array.isArray(transactions)) {
            const recentTransactions = transactions
                .filter(t => {
                    const transDate = new Date(t.date);
                    return differenceInDays(today, transDate) <= 7;
                })
                .filter(t => Math.abs(t.amount) >= 1000)
                .slice(0, 3);

            recentTransactions.forEach(trans => {
                allNotifications.push({
                    id: `trans-large-${trans.id}`,
                    type: 'Transaction' as const,
                    icon: DollarSign,
                    title: `Large ${trans.type === 'income' ? 'Income' : 'Expense'}: $${Math.abs(trans.amount).toFixed(2)}`,
                    description: trans.description || 'No description',
                    timestamp: trans.date,
                    priority: 'medium'
                });
            });
        }

        // Research session notifications - recent activity
        if (Array.isArray(researchSessions)) {
            const recentSessions = researchSessions
                .filter(session => {
                    const sessionDate = new Date(parseInt(session.id.split('-')[1]) || Date.now());
                    return differenceInDays(today, sessionDate) <= 3;
                })
                .slice(0, 2);

            recentSessions.forEach(session => {
                allNotifications.push({
                    id: `research-recent-${session.id}`,
                    type: 'Research' as const,
                    icon: Search,
                    title: `Recent Research: ${session.topic}`,
                    description: session.summary.substring(0, 50) + '...',
                    timestamp: new Date(parseInt(session.id.split('-')[1]) || Date.now()).toISOString(),
                    priority: 'low'
                });
            });
        }

        // Sort by priority (high first) and timestamp (most recent first)
        return allNotifications.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [tasks, goals, accounts, projects, clients, networkContacts, learningResources, transactions, researchSessions, appSettings]);


    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const NotificationsSection = () => {
        const highPriority = notifications.filter(n => n.priority === 'high');
        const mediumPriority = notifications.filter(n => n.priority === 'medium');
        const lowPriority = notifications.filter(n => n.priority === 'low' || !n.priority);

        const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
            switch (priority) {
                case 'high':
                    return 'bg-destructive/10 text-destructive';
                case 'medium':
                    return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
                case 'low':
                default:
                    return 'bg-secondary text-muted-foreground';
            }
        };

        const renderNotification = (item: ActivityItem) => (
            <div key={item.id} className="flex items-start gap-3">
                <div className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full ${getPriorityColor(item.priority)}`}>
                    <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </p>
                </div>
            </div>
        );

        if (notifications.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-6 text-sm">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    All caught up!
                </div>
            );
        }

        return (
            <>
                {highPriority.length > 0 && (
                    <>
                        {highPriority.length > 1 && (
                            <div className="text-xs font-semibold text-destructive mb-2 px-1">
                                High Priority ({highPriority.length})
                            </div>
                        )}
                        {highPriority.map(renderNotification)}
                        {(mediumPriority.length > 0 || lowPriority.length > 0) && <div className="h-4" />}
                    </>
                )}
                {mediumPriority.length > 0 && (
                    <>
                        {mediumPriority.length > 1 && highPriority.length > 0 && (
                            <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2 px-1">
                                Medium Priority ({mediumPriority.length})
                            </div>
                        )}
                        {mediumPriority.map(renderNotification)}
                        {lowPriority.length > 0 && <div className="h-4" />}
                    </>
                )}
                {lowPriority.length > 0 && (
                    <>
                        {lowPriority.length > 1 && (highPriority.length > 0 || mediumPriority.length > 0) && (
                            <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                                Other ({lowPriority.length})
                            </div>
                        )}
                        {lowPriority.map(renderNotification)}
                    </>
                )}
            </>
        );
    };

    const ActivitySection = () => (
        <>
            {activityFeed.length > 0 ? activityFeed.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                    <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full bg-secondary">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
                    </div>
                </div>
            )) : (
                <div className="text-center text-muted-foreground py-6 text-sm">
                    No recent activity.
                </div>
            )}
        </>
    );



    // Alfred pinned chat removed

    const SponsoredSection = () => (
        <div className="flex flex-col w-full max-w-full border rounded-lg bg-card/50 overflow-hidden shadow-sm">
            <div className="w-full bg-muted/30 px-3 py-1.5 flex items-center justify-between border-b border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold z-10">Advertisement</span>
            </div>
            <div className="w-full min-h-[250px] flex items-center justify-center p-2 max-w-full overflow-hidden">
                <GoogleAdBanner 
                    adSlot="right-sidebar-ad-slot" 
                    adFormat="vertical" 
                    fullWidthResponsive={false}
                    className="w-full h-full flex items-center justify-center max-w-full" 
                />
            </div>
        </div>
    );

    if (!appSettings?.rightSidebar?.isOpen) {
        return null;
    }

    return (
        <div className="flex flex-col h-full border-l bg-background overflow-hidden">
            <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0">
                <h2 className="text-base font-semibold">Activity & Updates</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={toggleRightSidebar}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-8">
                    {/* Notifications */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Notifications</h3>
                        <div className="space-y-4">
                            <NotificationsSection />
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Recent Activity */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            <ActivitySection />
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Fixed Ad Section */}
            <div className="shrink-0 p-4 border-t bg-muted/10">
                <SponsoredSection />
            </div>
        </div>
    )
}
