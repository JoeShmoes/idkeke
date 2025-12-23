'use client';

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
import { useApp } from '@/components/layout/app-provider';
import { 
    LayoutDashboard, 
    Bot, 
    CheckSquare, 
    DollarSign, 
    BookOpen, 
    Settings, 
    ArrowRight, 
    Check,
    X,
    File
} from 'lucide-react';

const steps = [
  {
    title: 'Welcome to ContextFlow',
    description: 'Your all-in-one personal operating system. Manage your life, work, and growth in one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'Dashboard',
    description: 'Get a high-level overview of your tasks, finance, and health. Customize widgets to suit your needs.',
    icon: LayoutDashboard,
  },
  {
    title: 'Alfred AI',
    description: 'Your personal AI assistant. Ask questions, generate content, and get help with your tasks.',
    icon: Bot,
  },
  {
    title: 'Tasks & Projects',
    description: 'Manage your daily to-dos and long-term projects. Use Kanban boards and lists to stay organized.',
    icon: CheckSquare,
  },
  {
    title: 'Finance & Assets',
    description: 'Track your income, expenses, and net worth. Manage your physical and digital assets.',
    icon: DollarSign,
  },
  {
    title: 'File Vault',
    description: 'Securely store your documents. Connect cloud storage like Google Drive or Dropbox to access all your files.',
    icon: File,
  },
  {
    title: 'Knowledge Base',
    description: 'Capture ideas in Notes, research topics, and save learning resources.',
    icon: BookOpen,
  },
  {
    title: 'Customization',
    description: 'Make it yours. Change themes, configure shortcuts, and adjust the layout in Settings.',
    icon: Settings,
  },
];

export default function Tour() {
  const { userProfile, setUserProfile } = useApp();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Show tour if user hasn't seen it
    if (userProfile.hasCompletedSetup && !userProfile.hasSeenTour) {
      setOpen(true);
    }
  }, [userProfile.hasCompletedSetup, userProfile.hasSeenTour]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setUserProfile((prev) => ({ ...prev, hasSeenTour: true }));
    setOpen(false);
  };

  const handleSkip = () => {
    setUserProfile((prev) => ({ ...prev, hasSeenTour: true }));
    setOpen(false);
  };

  const StepIcon = steps[currentStep].icon;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 w-fit">
            <StepIcon className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-1 py-4">
            {steps.map((_, index) => (
                <div 
                    key={index} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                    }`}
                />
            ))}
        </div>

        <DialogFooter className="sm:justify-between flex-row items-center gap-2">
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
            Skip Tour
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep === steps.length - 1 ? (
              <>
                Get Started <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
