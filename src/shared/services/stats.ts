import { getSecureToken } from '@/shared/auth/auth';
import { manifest } from '@/shared/config';

const BACKEND_URL = `http://${manifest.debuggerHost?.split(':').shift() || 'localhost'}:3000`;

export type StatResult = {
    elementId: string;
    isCorrect: boolean;
    difficulty?: number;
};

export type UserStatItem = {
    element_id: string;
    is_correct: boolean;
    difficulty: string; // numeric from PG comes as string often
    created_at: string;
};

export const StatsService = {
    async saveResults(results: StatResult[]): Promise<boolean> {
        try {
            const token = await getSecureToken();
            if (!token) return false;

            const res = await fetch(`${BACKEND_URL}/api/stats/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ results })
            });

            const data = await res.json();
            return data.ok;
        } catch (e) {
            console.error('StatsService saveResults error:', e);
            return false;
        }
    },

    async getUserStats(): Promise<UserStatItem[]> {
        try {
            const token = await getSecureToken();
            if (!token) return [];

            const res = await fetch(`${BACKEND_URL}/api/stats/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.results) return data.results;
            return [];
        } catch (e) {
            console.error('StatsService getUserStats error:', e);
            return [];
        }
    }
};
