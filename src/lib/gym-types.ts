export interface WgerExercise {
    id: number;
    name: string;
    description: string;
    category: number;
    muscles: number[];
    muscles_secondary: number[];
    equipment: number[];
    language: number;
    uuid: string;
}

export interface WgerMuscle {
    id: number;
    name: string;
    name_en: string;
    is_front: boolean;
    image_url_main: string;
    image_url_secondary: string;
}

export interface WgerExerciseImage {
    id: number;
    exercise: number;
    image: string;
    is_main: boolean;
}

export interface WgerResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Internal App Types
export interface GymSet {
    id: string;
    weight: number;
    reps: number;
    completed: boolean;
}

export interface GymExercise {
    id: string; // Internal UUID
    wgerId: number;
    name: string;
    muscles: number[]; // Array of muscle IDs
    sets: GymSet[];
    notes?: string;
}

export interface GymWorkout {
    id: string;
    name: string;
    startTime?: string; // ISO
    endTime?: string; // ISO
    duration?: number; // seconds
    exercises: GymExercise[];
    status: 'planned' | 'in-progress' | 'completed';
    date: string; // ISO
}

export interface MuscleHeatmapData {
    [muscleId: number]: number; // 0-10 intensity
}
