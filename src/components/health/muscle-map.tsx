import React from 'react';
import { cn } from '@/lib/utils';
import { MuscleHeatmapData } from '@/lib/gym-types';

interface MuscleMapProps {
    data: MuscleHeatmapData;
    className?: string;
}

// Map Wger IDs to internal SVG keys
// 1: Biceps brachii -> biceps
// 2: Anterior deltoid -> shoulders
// 3: Serratus anterior -> chest
// 4: Pectoralis major -> chest
// 5: Triceps brachii -> triceps
// 6: Rectus abdominis -> abs
// 7: Gastrocnemius -> calves
// 8: Gluteus maximus -> glutes
// 9: Trapezius -> traps
// 10: Quadriceps femoris -> quads
// 11: Biceps femoris -> hamstrings
// 12: Latissimus dorsi -> lats
// 13: Brachialis -> biceps
// 14: Obliquus externus abdominis -> abs
// 15: Soleus -> calves
const MUSCLE_MAPPING: Record<number, string> = {
    1: 'biceps', 13: 'biceps',
    2: 'shoulders',
    3: 'chest', 4: 'chest',
    5: 'triceps',
    6: 'abs', 14: 'abs',
    7: 'calves', 15: 'calves',
    8: 'glutes',
    9: 'traps',
    10: 'quads',
    11: 'hamstrings',
    12: 'lats'
};

const getColor = (intensity: number) => {
    if (!intensity) return 'fill-muted/20 stroke-muted-foreground/20';
    if (intensity > 7) return 'fill-red-500 stroke-red-600'; // Trained a lot
    if (intensity > 3) return 'fill-blue-500 stroke-blue-600'; // Trained a little
    return 'fill-blue-200 stroke-blue-300'; // Lightly trained
};

export function MuscleMap({ data, className }: MuscleMapProps) {
    const getMuscleColor = (key: string) => {
        // Find all Wger IDs that map to this key
        const ids = Object.entries(MUSCLE_MAPPING)
            .filter(([_, val]) => val === key)
            .map(([id]) => Number(id));
        
        // Sum intensity
        const totalIntensity = ids.reduce((sum, id) => sum + (data[id] || 0), 0);
        return getColor(totalIntensity);
    };

    return (
        <div className={cn("flex flex-col items-center p-6 bg-card/50 rounded-xl border backdrop-blur-sm", className)}>
             <div className="flex gap-6 mb-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300" /> Light
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" /> Medium
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" /> Heavy
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-12 md:gap-24 justify-center items-center w-full">
                {/* Front View */}
                <div className="relative h-[400px] w-[200px]">
                    <h3 className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">Front</h3>
                    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-xl">
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Head (neutral) */}
                        <path d="M85,20 C85,10 115,10 115,20 V45 C115,55 85,55 85,45 Z" className="fill-muted stroke-muted-foreground/20" />
                        
                        {/* Traps (Front View) */}
                        <path d="M75,55 L85,45 L115,45 L125,55 L140,65 L60,65 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('traps'))} />

                        {/* Shoulders */}
                        <path d="M45,65 Q60,55 75,65 L75,85 Q60,95 45,85 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('shoulders'))} />
                        <path d="M155,65 Q140,55 125,65 L125,85 Q140,95 155,85 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('shoulders'))} />

                        {/* Chest */}
                        <path d="M75,65 L125,65 L120,100 L80,100 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('chest'))} />

                        {/* Biceps */}
                        <path d="M45,85 L55,85 L55,115 L45,115 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('biceps'))} />
                        <path d="M145,85 L155,85 L155,115 L145,115 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('biceps'))} />

                        {/* Abs */}
                        <path d="M80,100 L120,100 L115,150 L85,150 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('abs'))} />

                        {/* Forearms */}
                        <path d="M42,115 L58,115 L55,150 L45,150 Z" className="fill-muted/10 stroke-muted-foreground/10" />
                        <path d="M142,115 L158,115 L155,150 L145,150 Z" className="fill-muted/10 stroke-muted-foreground/10" />

                        {/* Quads */}
                        <path d="M85,150 L115,150 L110,230 L90,230 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('quads'))} />
                        
                        {/* Calves (Front) */}
                        <path d="M90,240 L110,240 L108,320 L92,320 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('calves'))} />
                    </svg>
                </div>

                {/* Back View */}
                <div className="relative h-[400px] w-[200px]">
                    <h3 className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">Back</h3>
                    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-xl">
                        {/* Head */}
                        <path d="M85,20 C85,10 115,10 115,20 V45 C115,55 85,55 85,45 Z" className="fill-muted stroke-muted-foreground/20" />

                        {/* Traps */}
                        <path d="M85,45 L115,45 L125,65 L100,90 L75,65 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('traps'))} />

                        {/* Shoulders (Back) */}
                        <path d="M45,65 Q60,55 75,65 L75,85 Q60,95 45,85 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('shoulders'))} />
                        <path d="M155,65 Q140,55 125,65 L125,85 Q140,95 155,85 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('shoulders'))} />

                        {/* Lats */}
                        <path d="M75,85 L125,85 L115,140 L85,140 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('lats'))} />

                        {/* Triceps */}
                        <path d="M45,85 L55,85 L55,115 L45,115 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('triceps'))} />
                        <path d="M145,85 L155,85 L155,115 L145,115 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('triceps'))} />

                        {/* Glutes */}
                        <path d="M85,140 L115,140 L115,175 L85,175 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('glutes'))} />

                        {/* Hamstrings */}
                        <path d="M85,175 L115,175 L110,235 L90,235 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('hamstrings'))} />

                        {/* Calves (Back) */}
                        <path d="M90,240 L110,240 L108,310 L92,310 Z" className={cn("transition-colors duration-500 hover:opacity-80", getMuscleColor('calves'))} />
                    </svg>
                </div>
            </div>
        </div>
    );
}
