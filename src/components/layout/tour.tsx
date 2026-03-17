'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/layout/app-provider';
import {
    ArrowRight,
    ArrowLeft,
    Check,
    X,
    LayoutDashboard,
    Bot,
    CheckSquare,
    DollarSign,
    BookOpen,
    Settings,
    Folder,
    Users,
    TrendingUp,
    Palette,
    Zap,
    Shield,
    Sparkles,
    Terminal,
    Calendar,
    Network,
    FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    emoji: string;
    title: string;
    subtitle: string;
    description: string;
    color: string;
    features: { icon: React.ElementType; label: string }[];
}

const steps: Step[] = [
    {
        emoji: '👋',
        title: 'Welcome to Nexaris',
        subtitle: 'Your personal operating system',
        description: "Everything you need to manage your life, work, and growth — in one beautifully unified workspace.",
        color: 'from-violet-600 to-indigo-600',
        features: [
            { icon: Zap, label: 'Lightning fast' },
            { icon: Shield, label: 'Secure by default' },
            { icon: Sparkles, label: 'AI-powered' },
            { icon: Palette, label: 'Fully customisable' },
        ],
    },
    {
        emoji: '🧭',
        title: 'Dashboard',
        subtitle: 'Your command centre',
        description: "See everything at a glance. Tasks, finances, calendar events, and growth stats — all on one page, always up to date.",
        color: 'from-blue-600 to-cyan-500',
        features: [
            { icon: LayoutDashboard, label: 'Overview widgets' },
            { icon: TrendingUp, label: 'Live stats' },
            { icon: Calendar, label: 'Upcoming events' },
            { icon: CheckSquare, label: 'Task summary' },
        ],
    },
    {
        emoji: '🤖',
        title: 'Alfred AI',
        subtitle: 'Your intelligent assistant',
        description: "Ask Alfred anything. Draft emails, summarise notes, brainstorm ideas, and get instant answers from your own AI.",
        color: 'from-purple-600 to-pink-500',
        features: [
            { icon: Bot, label: 'Conversational AI' },
            { icon: BookOpen, label: 'Memory & context' },
            { icon: Terminal, label: 'Multi-model' },
            { icon: Sparkles, label: 'Content generation' },
        ],
    },
    {
        emoji: '✅',
        title: 'Tasks & Projects',
        subtitle: 'Stay focused, stay on track',
        description: "From quick to-dos to full project pipelines. Use lists, Kanban boards, and due dates to keep everything moving.",
        color: 'from-emerald-600 to-teal-500',
        features: [
            { icon: CheckSquare, label: 'Smart task lists' },
            { icon: LayoutDashboard, label: 'Kanban boards' },
            { icon: Users, label: 'Client management' },
            { icon: TrendingUp, label: 'Project tracking' },
        ],
    },
    {
        emoji: '💰',
        title: 'Finance & Assets',
        subtitle: 'Know your numbers',
        description: "Track income, expenses, accounts, debts, and net worth. Get a clear picture of your financial health in seconds.",
        color: 'from-amber-500 to-orange-500',
        features: [
            { icon: DollarSign, label: 'Account tracking' },
            { icon: TrendingUp, label: 'Net worth' },
            { icon: FileSpreadsheet, label: 'Budgets' },
            { icon: Shield, label: 'Privacy mode' },
        ],
    },
    {
        emoji: '📚',
        title: 'Notes & Research',
        subtitle: 'Capture every idea',
        description: "A rich-text notes editor, an AI-powered research tool, and a learning tracker — your second brain, built in.",
        color: 'from-sky-600 to-blue-500',
        features: [
            { icon: BookOpen, label: 'Rich notes editor' },
            { icon: Bot, label: 'AI research' },
            { icon: Network, label: 'Learning tracker' },
            { icon: Folder, label: 'File vault' },
        ],
    },
    {
        emoji: '🚀',
        title: "You're all set!",
        subtitle: 'Let\'s get started',
        description: "Nexaris is yours to explore. Dive into any room from the sidebar, and customise everything from Settings.",
        color: 'from-rose-500 to-pink-600',
        features: [
            { icon: Settings, label: 'Settings & themes' },
            { icon: Zap, label: 'Keyboard shortcuts' },
            { icon: TrendingUp, label: 'Growth Hub & XP' },
            { icon: Sparkles, label: 'More coming soon' },
        ],
    },
];

export default function Tour() {
    const { userProfile, setUserProfile, isDataLoaded } = useApp();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const [animating, setAnimating] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Wait until localStorage has fully hydrated before checking
        if (!isDataLoaded) return;
        // Show the tour only once — when the user has never seen it
        if (!userProfile.hasSeenTour) {
            const t = setTimeout(() => {
                setOpen(true);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => setVisible(true));
                });
            }, 600);
            return () => clearTimeout(t);
        }
    }, [isDataLoaded, userProfile.hasSeenTour]);

    const markDone = useCallback(() => {
        setUserProfile((prev) => ({ ...prev, hasSeenTour: true }));
    }, [setUserProfile]);

    const dismiss = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            setOpen(false);
            markDone();
        }, 400);
    }, [markDone]);

    const go = useCallback((next: number) => {
        if (animating) return;
        setDirection(next > currentStep ? 'forward' : 'back');
        setAnimating(true);
        setTimeout(() => {
            setCurrentStep(next);
            setAnimating(false);
        }, 200);
    }, [animating, currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) go(currentStep + 1);
        else dismiss();
    };

    const handleBack = () => {
        if (currentStep > 0) go(currentStep - 1);
    };

    if (!open) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;
    const isFirst = currentStep === 0;
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500',
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={dismiss}
            />

            {/* Card */}
            <div
                className={cn(
                    'relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl',
                    'transition-all duration-500',
                    visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
                )}
            >
                {/* Gradient header */}
                <div className={cn('relative bg-gradient-to-br p-10 text-white', step.color)}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4" />

                    {/* Close button */}
                    <button
                        onClick={dismiss}
                        className="absolute top-5 right-5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
                        aria-label="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Step counter */}
                    <div className="absolute top-5 left-5 text-xs font-medium bg-white/20 rounded-full px-3 py-1">
                        {currentStep + 1} / {steps.length}
                    </div>

                    {/* Content */}
                    <div
                        className={cn(
                            'relative z-10 text-center mt-4 transition-all duration-200',
                            animating
                                ? direction === 'forward'
                                    ? 'opacity-0 translate-x-8'
                                    : 'opacity-0 -translate-x-8'
                                : 'opacity-100 translate-x-0'
                        )}
                    >
                        <div className="text-7xl mb-4 select-none">{step.emoji}</div>
                        <div className="text-sm font-medium uppercase tracking-widest opacity-80 mb-2">
                            {step.subtitle}
                        </div>
                        <h2 className="text-4xl font-bold mb-4">{step.title}</h2>
                        <p className="text-white/80 text-base leading-relaxed max-w-md mx-auto">
                            {step.description}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="bg-background p-8">
                    {/* Feature pills */}
                    <div
                        className={cn(
                            'grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 transition-all duration-200',
                            animating ? 'opacity-0' : 'opacity-100'
                        )}
                    >
                        {step.features.map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30 p-4 text-center"
                            >
                                <Icon className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all duration-500 bg-gradient-to-r', step.color)}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Dot indicators */}
                    <div className="flex justify-center gap-1.5 mb-6">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => go(i)}
                                className={cn(
                                    'rounded-full transition-all duration-300',
                                    i === currentStep
                                        ? 'w-6 h-2 bg-foreground'
                                        : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                                )}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={isFirst ? dismiss : handleBack}
                            className="text-muted-foreground"
                        >
                            {isFirst ? (
                                'Skip tour'
                            ) : (
                                <><ArrowLeft className="w-4 h-4 mr-2" /> Back</>
                            )}
                        </Button>

                        <Button
                            onClick={handleNext}
                            className={cn('gap-2 px-6 bg-gradient-to-r text-white border-0', step.color)}
                        >
                            {isLast ? (
                                <>Get Started <Check className="w-4 h-4" /></>
                            ) : (
                                <>Next <ArrowRight className="w-4 h-4" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
