import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'twist' | 'flicki' | 'discussion';
    timestamp: number;
    imageUri?: string; // For Flicki/User images
}

export interface ChatSession {
    id: string;
    title: string;
    preview: string; // Last message preview
    timestamp: number; // Last updated
    mode: 'twist' | 'flicki' | 'discussion' | 'mixed'; // Dominant mode or mixed
    messages: ChatMessage[];
}

const STORAGE_KEY = 'TDJP_CHAT_SESSIONS';

export const ChatStorageService = {

    // Load all sessions (metadata only ideally, but we'll load all for simplicity for now)
    async getSessions(): Promise<ChatSession[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load chat sessions', e);
            return [];
        }
    },

    // Save or Update a session
    async saveSession(session: ChatSession): Promise<void> {
        try {
            const sessions = await ChatStorageService.getSessions();
            const index = sessions.findIndex(s => s.id === session.id);

            if (index >= 0) {
                // Update existing
                sessions[index] = session;
            } else {
                // Add new to top
                sessions.unshift(session);
            }

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch (e) {
            console.error('Failed to save chat session', e);
        }
    },

    // Delete a session
    async deleteSession(sessionId: string): Promise<void> {
        try {
            const sessions = await ChatStorageService.getSessions();
            const filtered = sessions.filter(s => s.id !== sessionId);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (e) {
            console.error('Failed to delete chat session', e);
        }
    },

    // Create a new session
    createSession(): ChatSession {
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: 'New Chat',
            preview: '',
            timestamp: Date.now(),
            mode: 'twist', // Default start
            messages: []
        };
    },

    // Helper to generate a title from the first message
    generateTitle(text: string): string {
        return text.length > 30 ? text.substring(0, 30) + '...' : text;
    }
};
