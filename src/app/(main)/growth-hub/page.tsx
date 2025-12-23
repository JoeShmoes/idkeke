
'use client';

import { useApp } from '@/components/layout/app-provider';
import { allAchievements, type Achievement } from '@/lib/achievements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, CheckCircle, Lock, Gem } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { perks } from '../perks';

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

const AchievementCard = ({ ach, isUnlocked }: { ach: Achievement, isUnlocked: boolean }) => {
    const Icon = ach.icon;

    return (
        <div className={cn("flex items-start gap-4 p-4 rounded-lg border", isUnlocked ? "bg-card" : "bg-muted/50")}>
            <div className={cn("flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0", isUnlocked ? 'bg-green-500/20' : 'bg-muted-foreground/10')}>
                 <Icon className={cn("h-5 w-5", isUnlocked ? 'text-green-500' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1">
                <p className={cn("font-semibold text-sm", !isUnlocked && 'text-muted-foreground')}>{ach.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
            </div>
            <p className="text-sm font-bold text-yellow-500 whitespace-nowrap">{ach.points} XP</p>
        </div>
    );
}

export default function GrowthHubPage() {
    const { tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts } = useApp();

    const { unlockedAchievements, totalPoints, currentLevel, progressToNextLevel, pointsForNextLevel } = useMemo(() => {
        let points = 0;
        const unlocked: Achievement[] = [];
        
        allAchievements.forEach(ach => {
            let isUnlocked = false;
            switch (ach.category) {
                case 'tasks': isUnlocked = tasks.filter(t => t.completed).length >= ach.threshold; break;
                case 'clients': isUnlocked = clients.length >= ach.threshold; break;
                case 'projects': isUnlocked = projects.filter(p => p.status === 'completed').length >= ach.threshold; break;
                case 'finance': const netWorth = accounts.reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0); isUnlocked = netWorth >= ach.threshold; break;
                case 'notes': isUnlocked = notes.length >= ach.threshold; break;
                case 'assets': const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0); isUnlocked = totalAssetValue >= ach.threshold; break;
                case 'learning': isUnlocked = learningResources.filter(r => r.status === 'completed').length >= ach.threshold; break;
                case 'networking': isUnlocked = networkContacts.length >= ach.threshold; break;
            }
            if (isUnlocked) {
                unlocked.push(ach);
                points += ach.points;
            }
        });
        
        let level = 1;
        while (level < levelThresholds.length && points >= levelThresholds[level]) { level++; }
        
        const currentLevelPoints = levelThresholds[level - 1] || 0;
        const nextLevelPoints = levelThresholds[level] || Infinity;
        const progress = nextLevelPoints === Infinity ? 100 : ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

        return { unlockedAchievements: unlocked, totalPoints: points, currentLevel: level, progressToNextLevel: progress, pointsForNextLevel: nextLevelPoints };
    }, [tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts]);

    const groupedAchievements = useMemo(() => {
        const groups: Record<string, Achievement[]> = {};
        allAchievements.forEach(ach => {
            const category = ach.category.charAt(0).toUpperCase() + ach.category.slice(1);
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(ach);
        });
        return groups;
    }, []);
    
    return (
        <div className="space-y-8">
            <Card className="bg-card/50 overflow-hidden">
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 mb-4">
                            <h2 className="text-4xl font-bold text-primary">{currentLevel}</h2>
                        </div>
                        <p className="text-xl font-semibold">Level {currentLevel}</p>
                        <p className="text-muted-foreground">Total XP: {totalPoints.toLocaleString()}</p>
                    </div>
                    <div className="max-w-md mx-auto mt-6">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{totalPoints.toLocaleString()} XP</span>
                            <span>Next Level at {pointsForNextLevel.toLocaleString()} XP</span>
                        </div>
                        <Progress value={progressToNextLevel} className="h-2"/>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Award className="h-5 w-5" /> All Achievements
                        </CardTitle>
                        <CardDescription>Complete goals to earn XP and level up.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full">
                           {Object.entries(groupedAchievements).map(([category, achievements]) => (
                               <AccordionItem value={category} key={category}>
                                   <AccordionTrigger>{category}</AccordionTrigger>
                                   <AccordionContent className="space-y-3">
                                       {achievements.map(ach => (
                                           <AchievementCard 
                                               key={ach.id}
                                               ach={ach}
                                               isUnlocked={unlockedAchievements.some(unlocked => unlocked.id === ach.id)}
                                           />
                                       ))}
                                   </AccordionContent>
                               </AccordionItem>
                           ))}
                        </Accordion>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gem className="h-5 w-5" /> Perks & Rewards
                        </CardTitle>
                        <CardDescription>Rewards unlock automatically as you level up.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {perks.map(perk => {
                            const isUnlocked = currentLevel >= perk.level;
                            const PerkIcon = perk.icon;
                            return (
                                <div key={perk.title} className={cn("flex items-start gap-4 p-4 rounded-lg border", isUnlocked ? "bg-card" : "bg-muted/50")}>
                                    <div className="mt-1">{isUnlocked ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Lock className="h-6 w-6 text-muted-foreground" />}</div>
                                    <div className="flex-1">
                                        <p className={cn("font-semibold", !isUnlocked && "text-muted-foreground")}>{perk.title}</p>
                                        <p className="text-sm text-muted-foreground">{perk.description}</p>
                                    </div>
                                    {!isUnlocked && <p className="text-sm font-semibold text-muted-foreground">Lv. {perk.level}</p>}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

    