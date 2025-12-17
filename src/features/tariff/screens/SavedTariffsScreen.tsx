import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import TopBar from '@/shared/ui/TopBar';
import { TariffService, SavedTariff } from '@/features/tariff/services/TariffService';
import { Ionicons } from '@expo/vector-icons';
import { exportTariffPdf } from '@/features/tariff/export/exportTariffPdf';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import TariffExportSuccessModal from '@/features/tariff/components/TariffExportSuccessModal';
import TariffDeleteConfirmModal from '@/features/tariff/components/TariffDeleteConfirmModal';
// @ts-ignore
import { getContentUriAsync } from 'expo-file-system'; // Try importing directly again, as legacy might not be exposed? 
// No, error said import FROM 'expo-file-system/legacy'.
// Let's do that.
// @ts-ignore
const getContentUriAsyncLegacy = require('expo-file-system/legacy').getContentUriAsync;

export default function SavedTariffsScreen() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const nav = useNavigation<any>();
    const isRTL = lang === 'he';

    const [tariffs, setTariffs] = useState<SavedTariff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportedUri, setExportedUri] = useState<string | null>(null);

    const loadTariffs = useCallback(async () => {
        setLoading(true);
        try {
            const list = await TariffService.getTariffs();
            setTariffs(list);
        } catch (e) {
            console.error(e);
            // alert('Failed to load tariffs'); 
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTariffs();
        }, [loadTariffs])
    );

    const handleDelete = (id: string) => {
        setDeletingId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await TariffService.deleteTariff(deletingId);
            // Remove from list immediately for UX
            setTariffs(prev => prev.filter(item => item.id !== deletingId));
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete');
        } finally {
            setDeletingId(null);
            setShowDeleteConfirm(false);
        }
    };

    const handleEdit = (tariff: SavedTariff) => {
        // Navigate to TariffScreen with params to pre-fill
        // Ideally we pass the whole 'tariff' object or just the ID and fetch it?
        // Passing data is faster.
        // We need to map `TariffExportData` back to the internal state of TariffScreen. (DisplayItem etc)
        // This mapping might be complex if we only stored the "Export Data" (PDF overlay strings).
        // WAIT. `TariffExportData` contains: symbols, values. It DOES NOT contain the internal `DisplayItem` objects (ids etc).
        // This is a problem for "Editing".
        // If we only saved the PDF-ready data (strings), we can't fully "Edit" it back in the Calculator (which needs Element IDs).

        // Check `backend/index.js` -> Schema `data jsonb`.
        // Check `TariffScreen` save logic -> `prepareExportData`.
        // `mapPassDisplayToExport` converts objects to strings.
        // ISSUE: We are losing the original `DisplayItem` data (element IDs) when saving ONLY `exportData`.
        // REQUIREMENT: "Edit: Navigates... pre-filling all details... allowing for editing."

        // FIX: We must save the FULL internal state (pass1Display, pass2Display, athlete form) alongside the export data OR inside it.
        // I will pass `tariff` to TariffScreen. TariffScreen needs to handle "importing" this data.
        // Since I can't easily change the backend schema "data" field structure without migration (it fits JSON), I can just put MORE data into it.
        // But `TariffExportData` is typed.
        // I should probably update `TariffExportData` OR validly just save `{ exportData, internalState }` in the DB `data` column?
        // The DB column `data` is `jsonb`, so it can hold anything.
        // `TariffService.createTariff` takes `data: any`.

        // So, I will assume for now we pass the `tariff` object, and I will need to update `TariffScreen` to save `internalState` too.

        nav.navigate('TariffStack', {
            screen: 'Tariff',
            params: {
                editTariffId: tariff.id,
                initialData: tariff.data // This needs to contain internal state to be useful for editing
            }
        });
    };

    const handleExport = async (tariff: SavedTariff) => {
        // We have the export data ready!
        try {
            const { uri } = await exportTariffPdf(tariff.data);
            setExportedUri(uri);
            setShowExportModal(true);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    const handleOpenPdf = async () => {
        if (!exportedUri) return;
        try {
            if (Platform.OS === 'android') {
                const contentUri = await getContentUriAsyncLegacy(exportedUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1,
                    type: 'application/pdf'
                });
            } else {
                await Sharing.shareAsync(exportedUri);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not open PDF');
        }
    };

    const handleSharePdf = async () => {
        if (!exportedUri) return;
        await Sharing.shareAsync(exportedUri);
    };

    const filtered = tariffs.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const renderItem = ({ item }: { item: SavedTariff }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Info Section */}
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start', justifyContent: 'center' }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.name}
                </Text>
                <Text style={[styles.cardDate, { color: colors.muted }]}>
                    {new Date(item.updated_at).toLocaleDateString()}
                </Text>
            </View>

            {/* Actions Section */}
            <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Pressable style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text
                        style={{ color: '#ef4444', fontSize: 11, textAlign: 'center', width: '100%' }}
                        maxFontSizeMultiplier={1} // Prevent scaling up
                        allowFontScaling={false}  // Bulletproof scaling
                        numberOfLines={1}
                        adjustsFontSizeToFit    // Shrink if needed
                    >
                        {t(lang, 'tariff.saved.actions.delete')}
                    </Text>
                </Pressable>

                <Pressable style={styles.actionBtn} onPress={() => handleEdit(item)}>
                    <Ionicons name="create-outline" size={20} color={colors.tint} />
                    <Text
                        style={{ color: colors.tint, fontSize: 11, textAlign: 'center', width: '100%' }}
                        maxFontSizeMultiplier={1}
                        allowFontScaling={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {t(lang, 'tariff.saved.actions.edit')}
                    </Text>
                </Pressable>

                <Pressable style={styles.actionBtn} onPress={() => handleExport(item)}>
                    <Ionicons name="share-outline" size={20} color={colors.text} />
                    <Text
                        style={{ color: colors.text, fontSize: 11, textAlign: 'center', width: '100%' }}
                        maxFontSizeMultiplier={1}
                        allowFontScaling={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {t(lang, 'tariff.saved.actions.export')}
                    </Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <TopBar
                title={t(lang, 'tabs.tariff')}
                showBack={true}
                onBack={() => nav.goBack()}
            />

            {/* Sub-Header matching TariffScreen style */}
            <View style={styles.subHeader}>
                <Text style={[styles.subHeaderText, { color: colors.text }]}>
                    {t(lang, 'tariff.saved.title')}
                </Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.muted} style={{ marginHorizontal: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder=""
                    placeholderTextColor={colors.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={t => t.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 40 }}>
                            {t(lang, 'tariff.saved.empty')}
                        </Text>
                    }
                />
            )}

            <TariffExportSuccessModal
                visible={showExportModal}
                onClose={() => setShowExportModal(false)}
                onOpen={handleOpenPdf}
                onShare={handleSharePdf}
            />

            <TariffDeleteConfirmModal
                visible={showDeleteConfirm}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    subHeader: {
        alignItems: 'center',
        marginVertical: 16, // Matches TariffScreen margins roughly
    },
    subHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        opacity: 0.7,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16, // Space below search
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(150,150,150, 0.1)',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 4,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardHeader: {
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDate: {
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 0,
        flexShrink: 0,
        minWidth: 180, // Safe zone
    },
    actionBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        width: 54, // Fixed width per button
        flexShrink: 0,
    }
});
