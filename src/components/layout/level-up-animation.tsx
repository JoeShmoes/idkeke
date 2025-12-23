
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle } from 'lucide-react';
import type { perks } from '@/app/(main)/perks';

interface LevelUpAnimationProps {
    isOpen: boolean;
    onClose: () => void;
    newLevel: number;
    unlockedPerks: typeof perks;
}

export default function LevelUpAnimation({ isOpen, onClose, newLevel, unlockedPerks }: LevelUpAnimationProps) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-center p-8 bg-background border-none shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className="flex justify-center">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 animate-pulse">
                            <Award className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-4xl font-bold">Level Up!</DialogTitle>
                    <DialogDescription className="text-2xl text-muted-foreground">
                        You have reached Level {newLevel}
                    </DialogDescription>
                </DialogHeader>
                {unlockedPerks.length > 0 && (
                    <div className="mt-6 space-y-4 text-left">
                         <h3 className="font-semibold text-lg">New Perks Unlocked:</h3>
                        {unlockedPerks.map((perk, index) => (
                             <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-medium">{perk.title}</p>
                                    <p className="text-sm text-muted-foreground">{perk.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 <div className="mt-8">
                    <Button onClick={onClose} className="w-full">Continue</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
