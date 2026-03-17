'use client';

import { useState } from 'react';
import { wgerApi } from '@/lib/wger-api';
import { WgerExercise, GymExercise, GymSet, GymWorkout } from '@/lib/gym-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Trash2, Save, Dumbbell } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutBuilderProps {
    onSave: (workout: GymWorkout) => void;
    onCancel: () => void;
}

export function WorkoutBuilder({ onSave, onCancel }: WorkoutBuilderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<WgerExercise[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState<GymExercise[]>([]);
    const [workoutName, setWorkoutName] = useState('');

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
        setSelectedExercises([...selectedExercises, newExercise]);
    };

    const removeExercise = (id: string) => {
        setSelectedExercises(selectedExercises.filter(e => e.id !== id));
    };

    const addSet = (exerciseId: string) => {
        setSelectedExercises(selectedExercises.map(e => {
            if (e.id === exerciseId) {
                return {
                    ...e,
                    sets: [...e.sets, { id: uuidv4(), weight: 0, reps: 0, completed: false }]
                };
            }
            return e;
        }));
    };

    const removeSet = (exerciseId: string, setId: string) => {
        setSelectedExercises(selectedExercises.map(e => {
            if (e.id === exerciseId) {
                return {
                    ...e,
                    sets: e.sets.filter(s => s.id !== setId)
                };
            }
            return e;
        }));
    };

    const handleSave = () => {
        if (!workoutName.trim() || selectedExercises.length === 0) return;
        
        const workout: GymWorkout = {
            id: uuidv4(),
            name: workoutName,
            exercises: selectedExercises,
            status: 'planned',
            date: new Date().toISOString()
        };
        onSave(workout);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Search Section */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Exercise Library</CardTitle>
                    <div className="flex gap-2">
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search exercises (e.g., Bench Press)"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? '...' : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
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
                            {searchResults.length === 0 && !isSearching && (
                                <div className="text-center text-muted-foreground py-8">
                                    Search for exercises to add to your workout.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Builder Section */}
            <Card className="flex flex-col border-primary/20">
                <CardHeader>
                    <CardTitle>New Workout</CardTitle>
                    <Input 
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="Workout Name (e.g., Chest Day)"
                        className="text-lg font-semibold"
                    />
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
                        <div className="space-y-4">
                            {selectedExercises.map((exercise, index) => (
                                <div key={exercise.id} className="p-4 border rounded-lg bg-card">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium flex items-center gap-2">
                                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{index + 1}</span>
                                            {exercise.name}
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={() => removeExercise(exercise.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                                        {exercise.sets.map((set, setIndex) => (
                                            <div key={set.id} className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground w-8">Set {setIndex + 1}</span>
                                                <span className="text-muted-foreground">Target: </span>
                                                <Input className="h-7 w-16" placeholder="kg" type="number" />
                                                <span className="text-muted-foreground">x</span>
                                                <Input className="h-7 w-16" placeholder="reps" type="number" />
                                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => removeSet(exercise.id, set.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="link" size="sm" className="h-6 px-0 text-muted-foreground" onClick={() => addSet(exercise.id)}>
                                            <Plus className="h-3 w-3 mr-1" /> Add Set
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {selectedExercises.length === 0 && (
                                <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                                    <Dumbbell className="h-12 w-12 opacity-20 mb-4" />
                                    <p>Add exercises from the library to build your routine.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!workoutName || selectedExercises.length === 0}>
                            <Save className="mr-2 h-4 w-4" /> Save Workout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
