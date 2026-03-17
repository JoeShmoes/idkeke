
import { useMemo } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { allAchievements } from '@/lib/achievements';

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

export function useLevel() {
    const { tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts, growthTasks } = useApp();

    return useMemo(() => {
        let points = 0;
        
        // 1. Calculate Achievement Points
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

        // 2. Add Growth Hub XP
        const growthXP = growthTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.xp, 0);
        points += growthXP;
        
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
            pointsForNextLevel: nextLevelPoints,
            xpInCurrentLevel: points - currentLevelPoints,
            xpRequiredForNextLevel: nextLevelPoints - currentLevelPoints
        };
    }, [tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts, growthTasks]);
}
