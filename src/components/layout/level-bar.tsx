
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useApp } from './app-provider';
import { allAchievements, type Achievement } from '@/lib/achievements';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LevelUpAnimation from './level-up-animation';
import { perks } from '@/app/(main)/perks';
import { Building, ClipboardCheck, Infinity, Shield } from 'lucide-react';

const levelThresholds = [
    0, 50, 125, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000, 
    75000, 100000, 130000, 165000, 205000, 250000, 300000, 355000, 415000,
    480000, 550000, 625000, 705000, 800000, 900000, 1000000, 1150000, 1300000,
    1500000, 1750000, 2000000, 2300000, 2600000, 2950000, 3300000, 3700000, 4100000, 4500000,
    5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000, 8500000, 9000000, 9500000,
    10000000, 10750000, 11500000, 12250000, 13000000, 13750000, 14500000, 15250000, 16000000,
    17000000, 18000000, 19000000, 20000000, 21000000, 22000000, 23000000, 24000000, 25000000,
    26500000, 28000000, 29500000, 31000000, 32500000, 34000000, 35500000, 37000000, 38500000,
    40000000, 42000000, 44000000, 46000000, 48000000, 50000000, 52500000, 55000000, 57500000,
    60000000, 63000000, 66000000, 69000000, 72000000, 75000000, 80000000, 85000000, 90000000,
    95000000, 100000000
];

export default function LevelBar() {
  const { tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts } = useApp();
  const [previousLevel, setPreviousLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [unlockedPerks, setUnlockedPerks] = useState<typeof perks> ([]);

  const { totalPoints, currentLevel, progressToNextLevel, pointsForNextLevel } = useMemo(() => {
    let points = 0;
    allAchievements.forEach(ach => {
        let isUnlocked = false;
        switch (ach.category) {
            case 'tasks':
                isUnlocked = tasks.filter(t => t.completed).length >= ach.threshold;
                break;
            case 'clients':
                isUnlocked = clients.length >= ach.threshold;
                break;
            case 'projects':
                isUnlocked = projects.filter(p => p.status === 'completed').length >= ach.threshold;
                break;
            case 'finance':
                const netWorth = accounts.reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0);
                isUnlocked = netWorth >= ach.threshold;
                break;
            case 'notes':
                isUnlocked = notes.length >= ach.threshold;
                break;
            case 'assets':
                const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);
                isUnlocked = totalAssetValue >= ach.threshold;
                break;
            case 'learning':
                isUnlocked = learningResources.filter(r => r.status === 'completed').length >= ach.threshold;
                break;
            case 'networking':
                isUnlocked = networkContacts.length >= ach.threshold;
                break;
        }
        if (isUnlocked) {
            points += ach.points;
        }
    });
    
    let level = 1;
    while (level < levelThresholds.length && points >= levelThresholds[level]) {
        level++;
    }
    
    const currentLevelPoints = levelThresholds[level - 1] || 0;
    const nextLevelPoints = levelThresholds[level] || Number.MAX_SAFE_INTEGER;
    const progress = nextLevelPoints === Number.MAX_SAFE_INTEGER ? 100 : ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

    return { 
        totalPoints: points, 
        currentLevel: level, 
        progressToNextLevel: progress,
        pointsForNextLevel: nextLevelPoints
    };
  }, [tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts]);

  useEffect(() => {
    if (currentLevel > previousLevel) {
        const newlyUnlocked = perks.filter(p => p.level > previousLevel && p.level <= currentLevel);
        setUnlockedPerks(newlyUnlocked);
        setShowLevelUp(true);
    }
    setPreviousLevel(currentLevel);
  }, [currentLevel, previousLevel]);


  return (
    <>
        <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
            <div className="flex items-center gap-2 w-32">
                <span className="text-sm font-bold">Lvl {currentLevel}</span>
                <Progress value={progressToNextLevel} className="h-2 flex-1" />
            </div>
            </TooltipTrigger>
            <TooltipContent>
            <p>
                {totalPoints.toLocaleString()} / 
                {pointsForNextLevel === Number.MAX_SAFE_INTEGER ? '∞' : (pointsForNextLevel as number).toLocaleString()} XP to next level
            </p>
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>
        <LevelUpAnimation 
            isOpen={showLevelUp}
            onClose={() => setShowLevelUp(false)}
            newLevel={currentLevel}
            unlockedPerks={unlockedPerks}
        />
    </>
  );
}
