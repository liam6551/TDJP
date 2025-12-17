import { apiFetch } from '@/shared/state/auth';
import { TariffExportData } from '@/features/tariff/export/tariffOverlay';

export interface SavedTariff {
    id: string;
    name: string;
    data: TariffExportData;
    created_at: string;
    updated_at: string;
}

export const TariffService = {
    /**
     * List all saved tariffs for the current user.
     */
    async getTariffs(): Promise<SavedTariff[]> {
        try {
            const res = await apiFetch('/api/tariffs');

            // apiFetch already throws on !res.ok, so if we're here, it succeeded
            if (!res.tariffs) {
                throw new Error('Invalid response: missing tariffs array');
            }

            return res.tariffs;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch tariffs');
        }
    },

    /**
     * Create a new saved tariff.
     * Backend handles name duplication by appending (1), (2), etc.
     */
    async createTariff(name: string, data: TariffExportData): Promise<SavedTariff> {
        const res = await apiFetch('/api/tariffs', {
            method: 'POST',
            body: { name, data },
        });
        if (!res.ok) throw new Error(res.error || 'Failed to save tariff');
        return res.tariff;
    },

    /**
     * Update an existing tariff (name and/or data).
     */
    async updateTariff(id: string, updates: { name?: string; data?: TariffExportData }): Promise<SavedTariff> {
        const res = await apiFetch(`/api/tariffs/${id}`, {
            method: 'PUT',
            body: updates,
        });
        if (!res.ok) throw new Error(res.error || 'Failed to update tariff');
        return res.tariff;
    },

    /**
     * Delete a saved tariff.
     */
    async deleteTariff(id: string): Promise<void> {
        const res = await apiFetch(`/api/tariffs/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error(res.error || 'Failed to delete tariff');
    }
};
