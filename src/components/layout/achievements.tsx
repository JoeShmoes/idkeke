
'use client';

import { useMemo } from 'react';
import { useApp } from './app-provider';
import { allAchievements, type Achievement } from '@/lib/achievements';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Achievements() {
  const { tasks, clients, projects, accounts } = useApp();

  const unlockedAchievements = useMemo(() => {
    return allAchievements.filter(ach => {
      switch (ach.category) {
        case 'tasks':
          const completedTasks = tasks.filter(t => t.completed).length;
          return completedTasks >= ach.threshold;
        case 'clients':
          return clients.length >= ach.threshold;
        case 'projects':
            const completedProjects = projects.filter(p => p.status === 'completed').length;
            return completedProjects >= ach.threshold;
        case 'finance':
            const netWorth = accounts.reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0);
            return netWorth >= ach.threshold;
        default:
          return false;
      }
    });
  }, [tasks, clients, projects, accounts]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
            {unlockedAchievements.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {unlockedAchievements.map(ach => (
                        <Tooltip key={ach.id}>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "h-10 w-10 flex items-center justify-center rounded-md border cursor-help",
                                    ach.tier === 'gold' && 'bg-yellow-400/20 border-yellow-500',
                                    ach.tier === 'silver' && 'bg-gray-400/20 border-gray-500',
                                    ach.tier === 'bronze' && 'bg-orange-400/20 border-orange-500',
                                )}>
                                    <ach.icon className={cn(
                                        "h-5 w-5",
                                        ach.tier === 'gold' && 'text-yellow-500',
                                        ach.tier === 'silver' && 'text-gray-500',
                                        ach.tier === 'bronze' && 'text-orange-500',
                                    )} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-semibold">{ach.title}</p>
                                <p className="text-sm text-muted-foreground">{ach.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-6 text-sm">
                    <Trophy className="h-8 w-8 mx-auto mb-2" />
                    <p>Start working to unlock achievements!</p>
                </div>
            )}
        </div>
      </div>
    </TooltipProvider>
  );
}
