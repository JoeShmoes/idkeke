'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/layout/app-provider';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Home,
  Bot,
  ListTodo,
  Presentation,
  CalendarDays,
  FileSpreadsheet,
  TrendingUp,
  KanbanSquare,
  Users,
  Microscope,
  Notebook,
  Wallet,
  Building,
  Lock,
  Rocket,
  Sparkles,
  Zap,
  Shield,
  LayoutDashboard,
  GraduationCap,
  Network,
  Briefcase,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';
import { supabase } from '@/lib/supabase';

interface Step {
  icon: any; // Can be a Lucide icon or an image path string
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  features: { icon: React.ElementType; label: string }[];
}

const steps: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Nexaris',
    subtitle: 'THE UNIFIED PRODUCTIVITY WORKSPACE',
    description: "Your all-in-one workspace designed for seamless management of work, life, and personal growth.",
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    features: [
      { icon: Zap, label: 'Instant Flow' },
      { icon: Shield, label: 'End-to-End Secure' },
      { icon: Bot, label: 'Alfred AI' },
      { icon: LayoutDashboard, label: 'Modular Design' },
    ],
  },
  {
    icon: '/Nexaris meida bg trans.png',
    title: 'Alfred AI Assistant',
    subtitle: 'INTELLIGENCE AT YOUR SERVICE',
    description: "Meet Alfred, your dedicated AI. From drafting documents to researching complex topics, he's here to assist.",
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      { icon: Bot, label: 'Conversational' },
      { icon: Microscope, label: 'Deep Research' },
      { icon: Sparkles, label: 'Smart Drafting' },
      { icon: Zap, label: 'Fast Responses' },
    ],
  },
  {
    icon: Home,
    title: 'Core Control',
    subtitle: 'YOUR NERVE CENTRE',
    description: "The Dashboard, Tasks, and Calendar keep you perfectly synchronized with your goals and deadlines.",
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      { icon: Home, label: 'Smart Dashboard' },
      { icon: ListTodo, label: 'Advanced Tasks' },
      { icon: CalendarDays, label: 'Global Calendar' },
      { icon: FileSpreadsheet, label: 'Fluid Sheets' },
    ],
  },
  {
    icon: TrendingUp,
    title: 'Growth & Strategy',
    subtitle: 'ELEVATE YOUR EXECUTION',
    description: "Manage complex projects, client relations, and track your overall growth through the integrated Hub.",
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    features: [
      { icon: TrendingUp, label: 'Growth Hub' },
      { icon: KanbanSquare, label: 'Kanban Boards' },
      { icon: Users, label: 'Client CRM' },
      { icon: Briefcase, label: 'Business Hub' },
    ],
  },
  {
    icon: Microscope,
    title: 'Intel & Research',
    subtitle: 'KNOWLEDGE IS POWER',
    description: "Deep-dive into any topic with AI-powered research sessions and maintain a structured knowledge base with Notes.",
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    features: [
      { icon: Microscope, label: 'Research Lab' },
      { icon: Notebook, label: 'Brain Notes' },
      { icon: Presentation, label: 'Collaboration' },
      { icon: Zap, label: 'Quick Insights' },
    ],
  },
  {
    icon: Wallet,
    title: 'Precision Finance',
    subtitle: 'KNOW YOUR NUMBERS',
    description: "Track every cent with our budgeting suite, asset monitors, and secure file vault.",
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: [
      { icon: Wallet, label: 'Budgeting' },
      { icon: Building, label: 'Asset Tracking' },
      { icon: Lock, label: 'File Vault' },
      { icon: Shield, label: 'Privacy Mode' },
    ],
  },
  {
    icon: Network,
    title: 'Connections',
    subtitle: 'NETWORK & LEARN',
    description: "Expand your professional circle and elevate your skillset with integrated learning resources.",
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    features: [
      { icon: Network, label: 'Networking' },
      { icon: GraduationCap, label: 'Learning' },
      { icon: Rocket, label: 'Impact' },
      { icon: Users, label: 'Community' },
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
    if (!isDataLoaded) return;
    
    if (!userProfile.hasSeenTour) {
      const t = setTimeout(() => {
        setOpen(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true));
        });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isDataLoaded, userProfile.hasSeenTour]);

  const markDone = useCallback(async () => {
    setUserProfile((prev) => ({ ...prev, hasSeenTour: true }));
    try {
        await supabase.auth.updateUser({ data: { has_seen_tour: true } });
    } catch (error) {
        console.error('Failed to update tour status in Supabase:', error);
    }
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
    }, 250);
  }, [animating, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) go(currentStep + 1);
    else dismiss();
  };

  const handleBack = () => {
    if (currentStep > 0) go(currentStep - 1);
    else dismiss();
  };

  if (!open) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const Icon = step.icon;
  const isImageIcon = typeof Icon === 'string';

  return (
    <div className={cn(
      'fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-700 ease-in-out',
      visible ? 'opacity-100 backdrop-blur-sm bg-black/40' : 'opacity-0 pointer-events-none'
    )}>
      {/* Backdrop for dismiss */}
      <div className="absolute inset-0" onClick={dismiss} />

      {/* Card Wrapper */}
      <div className={cn(
        'relative w-full max-w-lg bg-card/80 backdrop-blur-xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] rounded-[2.5rem] overflow-hidden transition-all duration-500 ease-out flex flex-col max-h-[90vh]',
        visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-12 opacity-0'
      )}>

        <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {/* Header Header */}
        <div className="p-8 pt-10 pb-6 flex flex-col items-center text-center">
          
          {/* Logo / Icon */}
          <div className={cn(
            'w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm transition-all duration-300 relative group',
            step.bgColor,
            animating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
          )}>
            <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse group-hover:scale-105 transition-transform" />
            {isImageIcon ? (
              <img src={Icon} alt="Step Icon" className="w-12 h-12 relative z-10 object-contain" />
            ) : (
              <Icon className={cn('w-10 h-10 relative z-10 transition-colors', step.color)} strokeWidth={1.5} />
            )}
          </div>

          {/* Subtitle */}
          <p className={cn(
            'text-[10px] font-bold tracking-[0.2em] uppercase mb-2 transition-all duration-300',
            step.color,
            animating ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          )}>
            {step.subtitle}
          </p>

          {/* Title */}
          <h2 className={cn(
            'text-2xl font-bold tracking-tight text-foreground mb-4 transition-all duration-300 delay-75',
            animating ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          )}>
            {step.title}
          </h2>

          {/* Description */}
          <p className={cn(
            'text-sm text-muted-foreground leading-relaxed transition-all duration-300 delay-150',
            animating ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          )}>
            {step.description}
          </p>
        </div>

        {/* Features List */}
        <div className="px-8 pb-8">
          <div className={cn(
            'grid grid-cols-2 gap-3 transition-all duration-300 delay-200',
            animating ? 'opacity-0' : 'opacity-100'
          )}>
            {step.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 group hover:border-primary/20 hover:bg-muted/60 transition-all">
                <div className="p-1.5 rounded-lg bg-card border border-border/40 text-muted-foreground group-hover:text-primary transition-colors">
                  <f.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        </div>

        {/* Footer Area */}
        <div className="bg-muted/30 border-t border-border/50 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            
            {/* Dot Progress */}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onMouseEnter={() => !animating && go(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentStep ? 'w-6 bg-foreground shadow-sm' : 'w-1.5 bg-border hover:bg-muted-foreground/30'
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Step count */}
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="px-4 h-10 rounded-xl text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all"
            >
              {isFirst ? 'Skip' : <><ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back</>}
            </Button>

            <Button
              onClick={handleNext}
              className={cn(
                'flex-1 h-10 rounded-xl text-xs font-bold gap-2 border-0 shadow-lg transition-all',
                'bg-foreground text-background hover:scale-[1.02] active:scale-95'
              )}
            >
              {isLast ? (
                <>Get Started <Check className="w-4 h-4" strokeWidth={2.5} /></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-muted/40">
           <div 
             className="h-full bg-primary transition-all duration-500 ease-out"
             style={{ width: `${progress}%` }}
           />
        </div>

      </div>
    </div>
  );
}
