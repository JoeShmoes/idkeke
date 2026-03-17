import { WgerExercise, WgerMuscle, WgerResponse, WgerExerciseImage } from './gym-types';

const BASE_URL = 'https://wger.de/api/v2';

export const wgerApi = {
    async searchExercises(query: string): Promise<WgerExercise[]> {
        // Language 2 is English
        const response = await fetch(`${BASE_URL}/exercise/?language=2&term=${encodeURIComponent(query)}&limit=20`);
        if (!response.ok) throw new Error('Failed to fetch exercises');
        const data: WgerResponse<WgerExercise> = await response.json();
        return data.results;
    },

    async getMuscles(): Promise<WgerMuscle[]> {
        const response = await fetch(`${BASE_URL}/muscle/`);
        if (!response.ok) throw new Error('Failed to fetch muscles');
        const data: WgerResponse<WgerMuscle> = await response.json();
        return data.results;
    },

    async getExerciseImages(exerciseId: number): Promise<WgerExerciseImage[]> {
        const response = await fetch(`${BASE_URL}/exerciseimage/?exercise=${exerciseId}`);
        if (!response.ok) return [];
        const data: WgerResponse<WgerExerciseImage> = await response.json();
        return data.results;
    }
};
