'use client';

import { useState, useEffect } from 'react';
import { GymWorkout, GymSet, GymExercise, WgerExercise } from '@/lib/gym-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Pause, Square, Clock, CheckCircle2, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wgerApi } from '@/lib/wger-api';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ActiveWorkoutProps {
    workout: GymWorkout;
    onComplete: (workout: GymWorkout) => void;
    onCancel: () => void;
}

export function ActiveWorkout({ workout: initialWorkout, onComplete, onCancel }: ActiveWorkoutProps) {
    const [workout, setWorkout] = useState<GymWorkout>({ ...initialWorkout, status: 'planned' });
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<WgerExercise[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hasStarted && !isPaused) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [hasStarted, isPaused]);

    const handleStart = () => {
        setHasStarted(true);
        setWorkout(prev => ({ ...prev, startTime: new Date().toISOString(), status: 'in-progress' }));
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const updateSet = (exerciseId: string, setId: string, updates: Partial<GymSet>) => {
        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex => {
                if (ex.id === exerciseId) {
                    return {
                        ...ex,
                        sets: ex.sets.map(s => {
                            if (s.id === setId) {
                                return { ...s, ...updates };
                            }
                            return s;
                        })
                    };
                }
                return ex;
            })
        }));
    };

    const addSet = (exerciseId: string) => {
        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex => {
                if (ex.id === exerciseId) {
                    return {
                        ...ex,
                        sets: [...ex.sets, { id: uuidv4(), weight: 0, reps: 0, completed: false }]
                    };
                }
                return ex;
            })
        }));
    };

    const removeSet = (exerciseId: string, setId: string) => {
        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex => {
                if (ex.id === exerciseId) {
                    return {
                        ...ex,
                        sets: ex.sets.filter(s => s.id !== setId)
                    };
                }
                return ex;
            })
        }));
    };

    const handleFinish = () => {
        const finishedWorkout: GymWorkout = {
            ...workout,
            endTime: new Date().toISOString(),
            duration: elapsedTime,
            status: 'completed'
        };
        onComplete(finishedWorkout);
    };

    // Exercise Search Logic
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await wgerApi.searchExercises(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const addExercise = (wgerExercise: WgerExercise) => {
        const newExercise: GymExercise = {
            id: uuidv4(),
            wgerId: wgerExercise.id,
            name: wgerExercise.name,
            muscles: wgerExercise.muscles,
            sets: [
                { id: uuidv4(), weight: 0, reps: 0, completed: false }
            ]
        };
        setWorkout(prev => ({
            ...prev,
            exercises: [...prev.exercises, newExercise]
        }));
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeExercise = (exerciseId: string) => {
        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header / Timer */}
            <div className="flex items-center justify-between bg-card p-6 rounded-xl border shadow-sm sticky top-4 z-10">
                <div>
                    <h2 className="text-2xl font-bold">{workout.name}</h2>
                    <p className="text-muted-foreground">
                        {hasStarted ? 'Active Session' : 'Ready to Start'}
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {hasStarted ? (
                        <>
                            <div className="font-mono text-4xl font-light tracking-wider">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => setIsPaused(!isPaused)}>
                                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                </Button>
                                <Button variant="destructive" onClick={onCancel}>
                                    <Square className="h-4 w-4 mr-2" /> Stop
                                </Button>
                                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleFinish}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Finish
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-2">
                             <Button variant="ghost" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button size="lg" className="px-8" onClick={handleStart}>
                                <Play className="h-5 w-5 mr-2" /> Start Workout
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
                {workout.exercises.map((exercise, exIndex) => (
                    <Card key={exercise.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                                        {exIndex + 1}
                                    </span>
                                    {exercise.name}
                                </CardTitle>
                                {!hasStarted && (
                                    <Button variant="ghost" size="sm" onClick={() => removeExercise(exercise.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                                <div className="w-12 text-center">Set</div>
                                <div>kg</div>
                                <div>Reps</div>
                                <div className="w-10 text-center">Done</div>
                            </div>
                            <div className="divide-y">
                                {exercise.sets.map((set, setIndex) => (
                                    <div 
                                        key={set.id} 
                                        className={cn(
                                            "grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 items-center transition-colors",
                                            set.completed && "bg-green-500/5"
                                        )}
                                    >
                                        <div className="w-12 text-center font-medium text-muted-foreground">
                                            {setIndex + 1}
                                        </div>
                                        <Input 
                                            type="number" 
                                            placeholder="0" 
                                            value={set.weight || ''} 
                                            onChange={(e) => updateSet(exercise.id, set.id, { weight: parseFloat(e.target.value) })}
                                            className="h-9"
                                        />
                                        <Input 
                                            type="number" 
                                            placeholder="0" 
                                            value={set.reps || ''} 
                                            onChange={(e) => updateSet(exercise.id, set.id, { reps: parseFloat(e.target.value) })}
                                            className="h-9"
                                        />
                                        <div className="w-10 flex justify-center">
                                            {hasStarted ? (
                                                <Checkbox 
                                                    checked={set.completed} 
                                                    onCheckedChange={(checked) => updateSet(exercise.id, set.id, { completed: checked as boolean })}
                                                    className="h-6 w-6"
                                                />
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSet(exercise.id, set.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 border-t bg-muted/10">
                                <Button variant="ghost" size="sm" className="w-full" onClick={() => addSet(exercise.id)}>
                                    <Plus className="h-3 w-3 mr-2" /> Add Set
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Add Exercise Button */}
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full py-8 border-dashed">
                            <Plus className="h-5 w-5 mr-2" /> Add Exercise
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Add Exercise</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 my-4">
                            <Input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search exercises..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? '...' : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="space-y-2">
                                {searchResults.map(exercise => (
                                    <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                        <div>
                                            <p className="font-medium">{exercise.name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {(exercise.description || '').replace(/<[^>]*>/g, '')}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => addExercise(exercise)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
