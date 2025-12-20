import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { useAuth } from '@/shared/state/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DailyQuote from './DailyQuote';
import { useNotifications } from '@/shared/state/useNotifications';
import NotificationsModal from '@/shared/ui/NotificationsModal';
import QuickQuizModal from './QuickQuizModal';
import TheoreticalMaterialModal from './TheoreticalMaterialModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { getStoredUri, setStoredUri, requestAndroidPermissions } from '@/shared/filesystem/storage';
import { Platform } from 'react-native';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);

export default function UserHome() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { user, adminUpdateUser, refreshUser } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickQuiz, setShowQuickQuiz] = useState(false);
    const [showTheoreticalModal, setShowTheoreticalModal] = useState(false);

    // const { notifications, unreadCount, markRead } = useNotifications(!!user); // Notification logic separate now
    const { notifications, unreadCount, markRead, fetchNotifications, markAllRead } = useNotifications(!!user); // Keep for bell icon
    const navigation = useNavigation<any>();

    const [statusDialog, setStatusDialog] = useState<{ visible: boolean, type: 'approved' | 'rejected' | null }>({ visible: false, type: null });

    const isRTL = lang === 'he';
    const textAlign = isRTL ? 'right' : 'left';

    // Check statuses on focus (Show Once Logic)
    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            const checkStatus = async () => {
                // Fetch latest user data to ensure status is fresh
                const freshUser = await refreshUser();

                // Force notification refresh immediately
                fetchNotifications();

                if (!freshUser) return; // Should not happen if logged in

                const key = `lastSeenStatus_${freshUser.id}`;
                const lastSeen = await SecureStore.getItemAsync(key);
                const current = freshUser.profileStatus;

                // Reset logic: If pending, reset seen unless it's already pending
                if (current === 'pending' && lastSeen !== 'pending') {
                    await SecureStore.setItemAsync(key, 'pending');
                    return;
                }

                // Show conditions
                if (current === 'approved' && lastSeen !== 'approved') {
                    setStatusDialog({ visible: true, type: 'approved' });
                } else if (current === 'rejected' && lastSeen !== 'rejected') {
                    setStatusDialog({ visible: true, type: 'rejected' });
                }
            };

            checkStatus();
        }, []) // Empty dependency array as we want this to run on every focus
    );

    const handleDialogClose = async () => {
        if (user?.profileStatus && user?.id) {
            const key = `lastSeenStatus_${user.id}`;
            await SecureStore.setItemAsync(key, user.profileStatus);
        }
        setStatusDialog({ visible: false, type: null });
    };

    const handleAction = async (action: 'approve' | 'reject' | 'edit', targetUserId: string) => {
        try {
            if (action === 'edit') {
                setShowNotifications(false);
                navigation.navigate('AdminUsers');
                return;
            }

            if (action === 'approve') {
                await adminUpdateUser(targetUserId, { profileStatus: 'approved' });
                Alert.alert(isRTL ? 'הצלחה' : 'Success', isRTL ? 'המשתמש אושר' : 'User approved');
            } else if (action === 'reject') {
                await adminUpdateUser(targetUserId, { profileStatus: 'rejected' });
                Alert.alert(isRTL ? 'בוצע' : 'Done', isRTL ? 'המשתמש נדחה' : 'User rejected');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Action failed');
        }
    };



    const [showStorageSetup, setShowStorageSetup] = useState(false);

    // Initial Storage Check (Android Only)
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS !== 'android') return;

            checkStorageSetup();
        }, [])
    );

    const checkStorageSetup = async () => {
        const hasUri = await getStoredUri();
        if (!hasUri) {
            setShowStorageSetup(true);
        }
    };

    const handleStorageSetup = async () => {
        try {
            const uri = await requestAndroidPermissions();
            if (uri) {
                await setStoredUri(uri);
                setShowStorageSetup(false);
                Alert.alert(isRTL ? 'הצלחה' : 'Success', t(lang, 'settings.storageSetup.success' as any));
            } else {
                // User cancelled or failed
                Alert.alert(isRTL ? 'שגיאה' : 'Error', t(lang, 'settings.storageSetup.error' as any));
            }
        } catch (e) {
            console.error('Setup failed', e);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Storage Setup Modal (Android) */}
            <Modal
                transparent
                visible={showStorageSetup}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <View style={{
                            width: 60, height: 60, borderRadius: 30,
                            backgroundColor: colors.tint + '20',
                            alignItems: 'center', justifyContent: 'center', marginBottom: 16
                        }}>
                            <Ionicons name="folder-open" size={32} color={colors.tint} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t(lang, 'settings.storageSetup.title' as any)}
                        </Text>

                        <Text style={[styles.modalBody, { color: colors.text }]}>
                            {t(lang, 'settings.storageSetup.message' as any)}
                        </Text>

                        <TouchableOpacity
                            onPress={handleStorageSetup}
                            style={[styles.modalBtn, { backgroundColor: colors.tint }]}
                        >
                            <Text style={styles.modalBtnText}>{t(lang, 'settings.storageSetup.button' as any)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <NotificationsModal
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                markRead={markRead}
                markAllRead={markAllRead}
                onAction={handleAction}
                colors={colors}
                isRTL={isRTL}
            />

            <QuickQuizModal
                visible={showQuickQuiz}
                onClose={() => setShowQuickQuiz(false)}
            />

            <TheoreticalMaterialModal
                visible={showTheoreticalModal}
                onClose={() => setShowTheoreticalModal(false)}
            />

            {/* Status Dialog (Success/Reject) */}
            <Modal
                transparent
                visible={statusDialog.visible}
                animationType="fade"
                onRequestClose={handleDialogClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <View style={{
                            width: 60, height: 60, borderRadius: 30,
                            backgroundColor: statusDialog.type === 'approved' ? '#dcfce7' : '#fee2e2',
                            alignItems: 'center', justifyContent: 'center', marginBottom: 16
                        }}>
                            <Ionicons
                                name={statusDialog.type === 'approved' ? "checkmark-circle" : "close-circle"}
                                size={40}
                                color={statusDialog.type === 'approved' ? "#16a34a" : "#dc2626"}
                            />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {statusDialog.type === 'approved' ? t(lang, 'home.statusDialog.approved.title' as any) : t(lang, 'home.statusDialog.rejected.title' as any)}
                        </Text>

                        <Text style={[styles.modalBody, { color: colors.muted }]}>
                            {statusDialog.type === 'approved' ? t(lang, 'home.statusDialog.approved.body' as any) : t(lang, 'home.statusDialog.rejected.body' as any)}
                        </Text>

                        <TouchableOpacity
                            onPress={handleDialogClose}
                            style={[
                                styles.modalBtn,
                                { backgroundColor: statusDialog.type === 'approved' ? '#16a34a' : '#dc2626' }
                            ]}
                        >
                            <Text style={styles.modalBtnText}>{t(lang, 'home.statusDialog.ok' as any)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.scroll} style={{ flex: 1 }}>
                {/* Header Section */}
                <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        <Text style={[styles.greeting, { color: colors.text, textAlign }]}>
                            {t(lang, 'home.greeting')}
                        </Text>
                        <Text style={[styles.username, { color: colors.tint, textAlign }]}>
                            {user?.fullName || user?.name}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowNotifications(true)}
                        style={{ position: 'relative', padding: 8 }}
                    >
                        <Ionicons name="notifications-outline" size={28} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={{
                                position: 'absolute', top: 4, right: 4,
                                backgroundColor: 'red', borderRadius: 10,
                                minWidth: 20, height: 20,
                                justifyContent: 'center', alignItems: 'center'
                            }}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Daily Quote - Hero Style (Replaces Daily Element) */}
                <View style={styles.section}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                            <Ionicons name="bulb" size={24} color="rgba(255,255,255,0.9)" />
                            <Text style={[styles.heroTitle, { marginHorizontal: 8, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                                {isRTL ? 'הציטוט היומי' : 'Daily Quote'}
                            </Text>
                        </View>

                        <View style={styles.heroContent}>
                            <DailyQuote />
                        </View>
                    </LinearGradient>
                </View>

                <CopilotStep text="Quick Actions" order={1} name="home_quick_actions">
                    <WalkthroughableView style={styles.grid}>
                        <QuickAction
                            icon="flash"
                            label={t(lang, 'home.quickActions.quiz')}
                            color={['#ff9a9e', '#fecfef'] as const}
                            onPress={() => setShowQuickQuiz(true)}
                        />
                        <QuickAction
                            icon="glasses"
                            label={t(lang, 'home.quickActions.ai' as any)}
                            color={['#a18cd1', '#fbc2eb'] as const}
                            onPress={() => navigation.navigate('AIChat')}
                        />
                        <QuickAction
                            icon="stats-chart"
                            label={t(lang, 'home.quickActions.stats')}
                            color={['#fbc2eb', '#a6c1ee'] as const}
                        />
                        <QuickAction
                            icon="book"
                            label={t(lang, 'home.quickActions.rules')}
                            color={['#84fab0', '#8fd3f4'] as const}
                            onPress={() => setShowTheoreticalModal(true)}
                        />
                    </WalkthroughableView>
                </CopilotStep>
            </ScrollView>
        </View>
    );
}

function QuickAction({ icon, label, color, onPress }: { icon: any, label: string, color: readonly [string, string, ...string[]], onPress?: () => void }) {
    const { colors } = useAppTheme();
    const navigation = useNavigation<any>(); // Access navigation

    const handlePress = () => {
        if (onPress) {
            onPress();
            return;
        }

        // Default navigation behavior if no onPress provided
        if (icon === 'calculator') navigation.navigate('Calculator');

        // Progress is in RootStack (parent of Tabs), so we might need to bubble up or just call navigate.
        // Usually navigate works, but if it fails, try getParent() or ensure the route name matches 'Progress'.
        if (icon === 'stats-chart') {
            navigation.navigate('Progress');
        }
    };

    return (
        <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card }]}
            activeOpacity={0.8}
            onPress={handlePress}
        >
            <LinearGradient
                colors={color}
                style={styles.iconCircle}
            >
                <Ionicons name={icon} size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
        gap: 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'center',
    },
    greeting: {
        fontSize: 18,
        opacity: 0.8,
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    section: {
        paddingHorizontal: 20,
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
        justifyContent: 'flex-start', // Changed from space-between
        shadowColor: '#764ba2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
        alignItems: 'center',
    },
    heroTitle: {
        color: 'rgba(255,255,255,0.9)', // Brighter
        fontSize: 16, // Larger
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    heroContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        width: '100%',
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        gap: 10,
        justifyContent: 'space-between',
    },
    actionBtn: {
        width: '48%',
        aspectRatio: 1.2,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center'
    },
    modalBody: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    modalBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 16,
        elevation: 2
    },
    modalBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});
