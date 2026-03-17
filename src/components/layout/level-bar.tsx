'use client';

import { useState, useEffect } from 'react';
import { useLevel } from '@/hooks/use-level';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LevelUpAnimation from './level-up-animation';
import { perks } from '@/app/(main)/perks';
import { Building, ClipboardCheck, Infinity, Shield, Zap, Crown, Star, Medal, Trophy, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const RANKS = [
    { threshold: 1, title: 'Novice', icon: Star, color: 'text-zinc-500' },
    { threshold: 5, title: 'Apprentice', icon: Zap, color: 'text-blue-500' },
    { threshold: 10, title: 'Adept', icon: Shield, color: 'text-green-500' },
    { threshold: 25, title: 'Expert', icon: Medal, color: 'text-purple-500' },
    { threshold: 50, title: 'Master', icon: Trophy, color: 'text-orange-500' },
    { threshold: 100, title: 'Legend', icon: Crown, color: 'text-yellow-500' },
];

export default function LevelBar() {
  const { currentLevel, totalPoints, progressToNextLevel, pointsForNextLevel, xpInCurrentLevel, xpRequiredForNextLevel } = useLevel();
  const [previousLevel, setPreviousLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [unlockedPerks, setUnlockedPerks] = useState<typeof perks>([]);

  const currentRank = [...RANKS].reverse().find(r => currentLevel >= r.threshold) || RANKS[0];
  const RankIcon = currentRank.icon;

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
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <motion.div 
                    className="flex items-center gap-2 bg-background/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/30 hover:bg-accent/50 transition-all cursor-pointer group relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Background Progress Fill (Subtle) */}
                    <div 
                        className="absolute inset-0 bg-primary/5 origin-left transition-transform duration-500 ease-out" 
                        style={{ transform: `scaleX(${progressToNextLevel / 100})` }}
                    />

                    <div className="flex items-center gap-2 relative z-10">
                        <div className={cn(
                            "flex items-center justify-center h-5 w-5 rounded-full shadow-sm border border-border/50 bg-gradient-to-br from-background to-muted text-[10px] font-bold text-foreground",
                            currentRank.color.replace('text-', 'border-').replace('500', '200')
                        )}>
                            {currentLevel}
                        </div>
                        
                        <div className="flex flex-col gap-0.5">
                            <div className="h-1 w-20 bg-muted/50 rounded-full overflow-hidden">
                                <motion.div 
                                    className={cn(
                                        "h-full shadow-[0_0_10px_rgba(var(--primary),0.5)]",
                                        "bg-gradient-to-r from-primary/80 to-primary" 
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNextLevel}%` }}
                                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                />
                            </div>
                        </div>

                        <span className="text-[10px] font-medium text-muted-foreground tabular-nums relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden whitespace-nowrap">
                            {Math.floor(progressToNextLevel)}%
                        </span>
                    </div>
                </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="w-80 p-0 border-border/50 shadow-xl bg-popover/95 backdrop-blur-xl z-[100]">
                <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-sm flex items-center gap-2">
                                <RankIcon className={cn("h-4 w-4", currentRank.color)} />
                                {currentRank.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">Level {currentLevel} • Keep growing to unlock perks</p>
                        </div>
                        <div className="text-2xl font-black text-primary/20">
                            {currentLevel}
                        </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Level XP</span>
                            <span>{Math.floor(xpInCurrentLevel).toLocaleString()} / {xpRequiredForNextLevel.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Total XP</span>
                            <span>{Math.floor(totalPoints).toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2">
                            <motion.div 
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressToNextLevel}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                            {Math.floor(xpRequiredForNextLevel - xpInCurrentLevel).toLocaleString()} XP needed for Level {currentLevel + 1}
                        </p>
                    </div>

                    {/* Next Unlocks */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Up Next</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {perks
                                .filter(p => p.level > currentLevel)
                                .slice(0, 2)
                                .map((perk, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-background/50 p-2.5 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
                                        <div className="p-1.5 bg-primary/10 rounded-md mt-0.5">
                                            {perk.icon === 'infinity' && <Infinity className="h-3 w-3 text-primary" />}
                                            {perk.icon === 'shield' && <Shield className="h-3 w-3 text-primary" />}
                                            {perk.icon === 'building' && <Building className="h-3 w-3 text-primary" />}
                                            {perk.icon === 'clipboard-check' && <ClipboardCheck className="h-3 w-3 text-primary" />}
                                            {!['infinity', 'shield', 'building', 'clipboard-check'].includes(perk.icon) && <Zap className="h-3 w-3 text-primary" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold">Level {perk.level}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{perk.description}</p>
                                        </div>
                                    </div>
                                ))}
                             {perks.filter(p => p.level > currentLevel).length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">Max level reached!</p>
                             )}
                        </div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>

        <LevelUpAnimation 
            open={showLevelUp} 
            onOpenChange={setShowLevelUp}
            level={currentLevel}
            unlockedPerks={unlockedPerks}
        />
    </>
  );
}
