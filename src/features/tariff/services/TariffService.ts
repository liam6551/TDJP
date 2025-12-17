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
        const res = await apiFetch('/api/tariffs');
        if (!res.ok) throw new Error(res.error || 'Failed to fetch tariffs');
        return res.tariffs;
    },

    /**
     * Create a new saved tariff.
     * Backend handles name duplication by appending (1), (2), etc.
     */
    async createTariff(name: string, data: TariffExportData): Promise<SavedTariff> {
        const res = await apiFetch('/api/tariffs', {
            method: 'POST',
            body: JSON.stringify({ name, data }),
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
            body: JSON.stringify(updates),
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
