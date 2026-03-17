'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { useLevel } from '@/hooks/use-level';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRouter } from 'next/navigation';
import { 
    Award, CheckCircle, Lock, Gem, TrendingUp, Zap, 
    Target, RefreshCw, Trophy, DollarSign, Brain, Rocket,
    ArrowUpRight, Star, User, KanbanSquare, BookOpen, Info,
    ArrowRight, Sparkles, LayoutDashboard, Wallet, Users, FileText,
    ExternalLink, Copy, Trash2
} from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { GrowthTask } from '@/lib/types';

// 3D Icon Component using Framer Motion
const Icon3D = ({ icon: Icon, color = "text-primary", size = "w-8 h-8" }: { icon: any, color?: string, size?: string }) => {
    return (
        <motion.div
            className={cn("relative flex items-center justify-center", size)}
            whileHover={{ 
                scale: 1.2, 
                rotateX: 15, 
                rotateY: 15,
                transition: { duration: 0.2 } 
            }}
            style={{ 
                perspective: "1000px",
                transformStyle: "preserve-3d" 
            }}
        >
            <div className={cn("absolute inset-0 opacity-20 blur-md rounded-full", color.replace('text-', 'bg-'))} />
            <Icon className={cn("relative z-10 drop-shadow-lg", color, size)} strokeWidth={2.5} />
        </motion.div>
    );
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { 
            staggerChildren: 0.1 
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 100 }
    }
};

export default function GrowthHubPage() {
    const { 
    growthTasks, setGrowthTasks, growthHistory, setGrowthHistory,
    tasks, accounts, clients, notes
  } = useApp();
    const { currentLevel, totalPoints, pointsForNextLevel, progressToNextLevel, xpInCurrentLevel, xpRequiredForNextLevel } = useLevel();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const hasGeneratedInitial = useRef(false);

    // Auto-replenish tasks (Infinite Generation)
    useEffect(() => {
        const pendingCount = growthTasks.filter(t => t.status === 'pending').length;
        // If pending tasks are low (less than 3), generate more
        if (pendingCount < 3 && !isLoadingAI) {
             // Small delay to prevent rapid-fire generation loops
             const timer = setTimeout(() => {
                 generateTasks(3 - pendingCount);
             }, 1000);
             return () => clearTimeout(timer);
        }
    }, [growthTasks, isLoadingAI]);

    // Initial Seed if completely empty (fallback)
    useEffect(() => {
        if (growthTasks.length === 0 && !hasGeneratedInitial.current) {
            hasGeneratedInitial.current = true;
            generateTasks(4);
        }
    }, [growthTasks.length]);

    // Auto-completion Logic (AI Detection)
    useEffect(() => {
        if (growthTasks.length === 0) return;

        let hasUpdates = false;
        const updatedTasks = growthTasks.map(task => {
            if (task.status === 'completed' || !task.criteria) return task;

            let isMet = false;
            switch (task.criteria.type) {
                case 'task_count':
                    const completedCount = tasks.filter(t => t.completed).length;
                    isMet = completedCount >= (task.criteria.target || 0);
                    break;
                case 'net_worth':
                    const netWorth = accounts.reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0);
                    isMet = netWorth >= (task.criteria.target || 0);
                    break;
                case 'client_count':
                    isMet = clients.length >= (task.criteria.target || 0);
                    break;
                case 'note_count':
                    isMet = notes.length >= (task.criteria.target || 0);
                    break;
            }

            if (isMet) {
                hasUpdates = true;
                return { ...task, status: 'completed' as const };
            }
            return task;
        });

        if (hasUpdates) {
            // Find newly completed tasks for the toast/history update
            const newlyCompleted = updatedTasks.filter((t, i) => t.status === 'completed' && growthTasks[i].status === 'pending');
            
            if (newlyCompleted.length > 0) {
                setGrowthTasks(updatedTasks); // Update state only if there are changes
                
                const xpGained = newlyCompleted.reduce((sum, t) => sum + t.xp, 0);
                
                toast({
                    title: "Goals Achieved!",
                    description: `AI Coach: Detected completion of ${newlyCompleted.length} tasks. +${xpGained} XP!`,
                });

                // Update history
                const today = new Date().toISOString().split('T')[0];
                setGrowthHistory(prev => {
                    const existing = prev.find(p => p.date === today);
                    if (existing) {
                        return prev.map(p => p.date === today ? { ...p, xpGained: p.xpGained + xpGained, tasksCompleted: p.tasksCompleted + newlyCompleted.length } : p);
                    }
                    return [...prev, { date: today, xpGained, tasksCompleted: newlyCompleted.length }];
                });
            }
        }
    }, [tasks, accounts, clients, notes, growthTasks]); // Reacting to data changes to check criteria

    const playGenerationSound = () => {
        try {
            const audio = new Audio('/generations.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed (interaction needed):', e));
        } catch (e) {
            console.error('Audio error:', e);
        }
    };

    const generateTasks = async (countToGenerate: number = 4) => {
        setIsLoadingAI(true);
        try {
            // Artificial delay to feel like AI
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const templates = [
                {
                    baseTitle: "Task Warrior",
                    baseDesc: "Complete {target} tasks across all projects.",
                    category: 'productivity',
                    criteriaType: 'task_count',
                    baseTarget: 5,
                    xpPerUnit: 40,
                    path: '/tasks',
                    icon: 'KanbanSquare'
                },
                {
                    baseTitle: "Financial Milestone",
                    baseDesc: "Reach a net worth of ${target}.",
                    category: 'finance',
                    criteriaType: 'net_worth',
                    baseTarget: 5000,
                    xpPerUnit: 0.1, // 500 XP for 5000
                    path: '/budgeting',
                    icon: 'DollarSign'
                },
                {
                    baseTitle: "Client Expansion",
                    baseDesc: "Add {target} new clients to your CRM.",
                    category: 'productivity',
                    criteriaType: 'client_count',
                    baseTarget: 2,
                    xpPerUnit: 175,
                    path: '/clients',
                    icon: 'Users'
                }
            ];

            const newTasks: GrowthTask[] = [];

            for (let i = 0; i < countToGenerate; i++) {
                // Pick a random template
                const template = templates[Math.floor(Math.random() * templates.length)];
                
                // Add some variance to target (0.8x to 1.5x)
                const variance = 0.8 + Math.random() * 0.7; 
                const target = Math.ceil(template.baseTarget * variance);
                
                // Calculate XP based on target
                const xp = Math.ceil(target * template.xpPerUnit);
                
                // Determine difficulty
                let difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium';
                if (xp < 100) difficulty = 'easy';
                else if (xp > 400) difficulty = 'hard';
                else if (xp > 800) difficulty = 'expert';

                newTasks.push({
                    id: crypto.randomUUID(),
                    title: template.baseTitle,
                    description: template.baseDesc.replace('{target}', target.toString()),
                    xp: xp,
                    difficulty: difficulty,
                    status: 'pending',
                    category: template.category as any,
                    criteria: { type: template.criteriaType as any, target: target },
                    path: template.path,
                    icon: template.icon
                });
            }

            // Filter out exact duplicates (same title and target)
            const uniqueNewTasks = newTasks.filter(nt => !growthTasks.some(gt => gt.title === nt.title && gt.criteria?.target === nt.criteria?.target && gt.status === 'pending'));

            if (uniqueNewTasks.length > 0) {
                setGrowthTasks(prev => [...prev, ...uniqueNewTasks]);
                playGenerationSound();
                toast({
                    title: "AI Coach: New Tasks Generated",
                    description: `I've analyzed your progress and created ${uniqueNewTasks.length} new challenges for you.`,
                });
            }
        } catch (error) {
            console.error("Failed to generate tasks", error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleManualComplete = (e: React.MouseEvent, taskId: string, xp: number) => {
        e.stopPropagation();
        setGrowthTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, status: 'completed' } : t
        ));
        
        const today = new Date().toISOString().split('T')[0];
        setGrowthHistory(prev => {
            const existing = prev.find(p => p.date === today);
            if (existing) {
                return prev.map(p => p.date === today ? { ...p, xpGained: p.xpGained + xp, tasksCompleted: p.tasksCompleted + 1 } : p);
            }
            return [...prev, { date: today, xpGained: xp, tasksCompleted: 1 }];
        });

        toast({
            title: "Task Completed",
            description: `+${xp} XP Added to your profile.`,
        });
    };

    const handleTaskClick = (task: GrowthTask) => {
        if (task.path) {
            router.push(task.path);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full overflow-hidden">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-background to-muted/20 p-6 rounded-2xl border border-border/50 shadow-sm"
            >
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <Icon3D icon={Brain} color="text-primary" size="w-12 h-12" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            Growth Hub AI
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                Beta
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Your personalized AI coach tracking your progress and assigning tailored tasks.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                    <div className="text-right">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Level</div>
                        <div className="text-4xl font-black text-foreground">{currentLevel}</div>
                    </div>
                    <div className="h-12 w-[1px] bg-border" />
                    <div className="text-right min-w-[120px]">
                         <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">XP Progress</div>
                         <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-2xl font-bold text-primary">{Math.floor(xpInCurrentLevel).toLocaleString()}</span>
                            <span className="text-lg text-muted-foreground font-medium">/ {xpRequiredForNextLevel.toLocaleString()}</span>
                         </div>
                         <Progress value={progressToNextLevel} className="h-1.5 mt-2 bg-muted/50" />
                         <div className="text-[10px] text-muted-foreground mt-1 text-right">
                            {Math.floor(progressToNextLevel)}% to Level {currentLevel + 1}
                         </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
                {/* Left Column: Stats */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6 flex flex-col h-full overflow-hidden"
                >
                    {/* Total XP Card (Renamed from Next Milestone) */}
                    <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                TOTAL XP
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{Math.floor(totalPoints).toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">points</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>Next Reward</span>
                                    <span className="text-primary font-medium">Level {currentLevel + 1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-md">
                                        <Lock className="h-3 w-3 text-primary" />
                                    </div>
                                    <span className="text-xs">Unlocks new AI capabilities</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 border-border/50 shadow-sm flex flex-col min-h-0">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthHistory.slice(-7)}>
                                    <defs>
                                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
                                    />
                                    <YAxis hide />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="xpGained" 
                                        stroke="hsl(var(--primary))" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorXp)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right Column: Active Tasks */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2 h-full min-h-0 flex flex-col"
                >
                    <Card className="h-full border-border/50 shadow-sm flex flex-col bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Active Challenges
                                </CardTitle>
                                <CardDescription>
                                    Tailored tasks to accelerate your growth.
                                </CardDescription>
                            </div>
                            {/* Auto-generation is handled by useEffect, manual button hidden/removed as requested, 
                                but kept small refresh icon just in case user gets stuck? 
                                User said: "Make these Active Challenges be automatically genarted rather than clicking on generate."
                                I will hide the big button and maybe just have a subtle indicator.
                            */}
                            {isLoadingAI && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Updating...
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0">
                            <ScrollArea className="h-full px-6 pb-6">
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    <AnimatePresence>
                                        {growthTasks.filter(t => t.status === 'pending').map((task) => (
                                            <TooltipProvider key={task.id}>
                                            <ContextMenu>
                                                <ContextMenuTrigger asChild>
                                                    <motion.div
                                                        variants={itemVariants}
                                                        layout
                                                        exit={{ opacity: 0, x: 50 }}
                                                        onClick={() => handleTaskClick(task)}
                                                        className={cn(
                                                            "group relative bg-card hover:bg-muted/50 border border-border/50 rounded-xl p-4 transition-all hover:shadow-md cursor-pointer",
                                                            task.path && "hover:border-primary/50"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className={cn(
                                                                    "p-3 rounded-xl flex items-center justify-center shadow-sm",
                                                                    task.category === 'finance' ? "bg-green-500/10 text-green-500" :
                                                                    task.category === 'productivity' ? "bg-blue-500/10 text-blue-500" :
                                                                    task.category === 'learning' ? "bg-purple-500/10 text-purple-500" :
                                                                    "bg-orange-500/10 text-orange-500"
                                                                )}>
                                                                    {task.icon === 'DollarSign' && <DollarSign className="h-6 w-6" />}
                                                                    {task.icon === 'Zap' && <Zap className="h-6 w-6" />}
                                                                    {task.icon === 'BookOpen' && <BookOpen className="h-6 w-6" />}
                                                                    {task.icon === 'KanbanSquare' && <KanbanSquare className="h-6 w-6" />}
                                                                    {task.icon === 'User' && <User className="h-6 w-6" />}
                                                                    {task.icon === 'Users' && <Users className="h-6 w-6" />}
                                                                    {!task.icon && <Target className="h-6 w-6" />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                                            {task.title}
                                                                        </h3>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="p-1 hover:bg-muted rounded-full transition-colors" onClick={(e) => e.stopPropagation()}>
                                                                                    <Info className="h-4 w-4 text-muted-foreground/50 hover:text-primary" />
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p className="max-w-xs text-xs">{task.description}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                                                                        {task.description}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <Badge variant="secondary" className="text-xs bg-muted/50 hover:bg-muted">
                                                                            {task.category}
                                                                        </Badge>
                                                                        <Badge variant="outline" className={cn(
                                                                            "text-xs capitalize",
                                                                            task.difficulty === 'easy' ? "text-green-500 border-green-500/20" :
                                                                            task.difficulty === 'medium' ? "text-yellow-500 border-yellow-500/20" :
                                                                            "text-red-500 border-red-500/20"
                                                                        )}>
                                                                            {task.difficulty}
                                                                        </Badge>
                                                                        {task.criteria && (
                                                                            <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary flex items-center gap-1">
                                                                                <RefreshCw className="h-3 w-3" />
                                                                                Auto-Tracked
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-3 justify-between h-full min-h-[80px]">
                                                                <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                                                    +{task.xp} XP
                                                                </div>
                                                                
                                                                {task.path ? (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                                                                    >
                                                                        Go to Task <ArrowRight className="ml-1 h-3 w-3" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                                                        onClick={(e) => handleManualComplete(e, task.id, task.xp)}
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                        Mark Done
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                                                    {task.path && (
                                                        <>
                                                            <ContextMenuItem onClick={() => router.push(task.path!)}>
                                                                <ArrowRight className="mr-2 h-4 w-4" />
                                                                Go to Task
                                                            </ContextMenuItem>
                                                        </>
                                                    )}
                                                    <ContextMenuItem onClick={(e) => handleManualComplete(e, task.id, task.xp)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Complete Task
                                                    </ContextMenuItem>
                                                    <ContextMenuItem 
                                                        onClick={() => setGrowthTasks(prev => prev.filter(t => t.id !== task.id))}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Dismiss Task
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                            </TooltipProvider>
                                        ))}
                                    </AnimatePresence>
                                    
                                    {growthTasks.filter(t => t.status === 'pending').length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Award className="h-16 w-16 mx-auto mb-4 opacity-20 text-primary animate-pulse" />
                                            <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                                            <p className="max-w-md mx-auto">You've completed all your active challenges. The AI is analyzing your performance and will generate new tasks shortly.</p>
                                        </div>
                                    )}
                                </motion.div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
