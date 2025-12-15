import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../../shared/state/auth';

// Types of Persona Modes
export type AIMode = 'twist' | 'flicki' | 'discussion';

// Interface for AI Service Response
export interface AIResponse {
    text: string;
    sender: 'twist' | 'flicki' | 'discussion';
}

/**
 * Service to handle AI Logic.
 * Connects to the backend via /ai/chat
 */
export const AIService = {

    /**
     * Process a user message and return an array of AI responses.
     * @param text User's message text
     * @param mode Current active persona
     * @param lang Current app language
     * @returns Promise<AIResponse[]>
     */
    async sendMessage(text: string, mode: AIMode, lang: 'he' | 'en'): Promise<AIResponse[]> {
        try {
            const token = await SecureStore.getItemAsync('tdjp_token');
            if (!token) {
                console.warn('AIService: No token found. User might not be logged in.');
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text, mode, lang })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'AI Request failed');
            }

            // Backend returns { ok: true, responses: [...] }
            return data.responses || [];

        } catch (error: any) {
            console.error('AI Service Error:', error);
            // Return a fallback error message so the chat doesn't crash
            return [{
                sender: mode === 'discussion' ? 'twist' : mode,
                text: lang === 'he'
                    ? `שגיאה בתקשורת עם השרת: ${error.message || 'אנא נסה שוב מאוחר יותר.'}`
                    : `Connection error: ${error.message || 'Please try again later.'}`
            }];
        }
    }
};
