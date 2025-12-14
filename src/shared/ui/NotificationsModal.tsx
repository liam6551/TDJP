import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/shared/state/auth';

type Props = {
    visible: boolean;
    onClose: () => void;
    notifications: any[];
    markRead: (id: string) => void;
    markAllRead: () => void;
    onAction: (action: 'approve' | 'reject' | 'edit', userId: string) => void;
    colors: any;
    isRTL: boolean;
};

export default function NotificationsModal({ visible, onClose, notifications, markRead, markAllRead, onAction, colors, isRTL }: Props) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState<'notifications' | 'updates'>('notifications');
    const [lastViewedNotifs, setLastViewedNotifs] = useState<string | null>(null);
    const [lastViewedUpdates, setLastViewedUpdates] = useState<string | null>(null);

    // Load Last Viewed Timestamps
    useEffect(() => {
        if (user?.id) {
            SecureStore.getItemAsync(`lastViewedNotifs_${user.id}`).then(setLastViewedNotifs);
            SecureStore.getItemAsync(`lastViewedUpdates_${user.id}`).then(setLastViewedUpdates);
        }
    }, [user?.id]);

    const [sessionThreshold, setSessionThreshold] = useState<string | null>(null);

    // Update Timestamp on Tab View
    useEffect(() => {
        if (visible && user?.id) {
            const now = new Date().toISOString();
            if (activeTab === 'notifications') {
                // Capture the PREVIOUS lastViewedNotifs into sessionThreshold for this session
                // We do this only once per open session (if sessionThreshold is null)
                // If lastViewedNotifs is null, it means first time ever, so we can treat all as new (or handle specifically)
                if (sessionThreshold === null) {
                    setSessionThreshold(lastViewedNotifs || '1970-01-01');
                }

                SecureStore.setItemAsync(`lastViewedNotifs_${user.id}`, now);
                setLastViewedNotifs(now);
            } else if (activeTab === 'updates') {
                SecureStore.setItemAsync(`lastViewedUpdates_${user.id}`, now);
                setLastViewedUpdates(now);
            }
        } else if (!visible) {
            setSessionThreshold(null);
        }
    }, [visible, activeTab, user?.id]);

    // Mark all as read on mount to clear global badge
    useEffect(() => {
        if (visible) {
            markAllRead();
        }
    }, [visible]);

    const getBadgeCount = (type: 'notifications' | 'updates') => {
        if (type === 'notifications') {
            if (!lastViewedNotifs) return notifications.length; // Count all as we ignore is_read locally
            // Compare created_at with lastViewedNotifs
            return notifications.filter(n => new Date(n.created_at) > new Date(lastViewedNotifs)).length;
        }
        return 0; // Updates placeholder
    };

    const notifBadge = getBadgeCount('notifications');
    const updatesBadge = getBadgeCount('updates');

    // Derived unread count for badge inside modal (managed by local storage logic)
    // We do NOT use notifications.filter(is_read) anymore because we mark them all read on open

    const Badge = ({ count }: { count: number }) => {
        if (count === 0) return null;
        return (
            <View style={{
                backgroundColor: '#ef4444',
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
            }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{count}</Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlayContainer}>
                {/* Backdrop - Handles Close */}
                <Pressable style={styles.backdrop} onPress={onClose} />

                {/* Content - Sits on top */}
                <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>

                    {/* Header with Close Button */}
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('notifications')}
                            style={[styles.tab, {
                                borderBottomColor: activeTab === 'notifications' ? colors.tint : 'transparent',
                                flexDirection: isRTL ? 'row-reverse' : 'row'
                            }]}
                        >
                            <Text style={[styles.tabText, {
                                color: activeTab === 'notifications' ? colors.tint : colors.muted,
                                fontWeight: activeTab === 'notifications' ? 'bold' : 'normal'
                            }]}>
                                {isRTL ? "התראות" : "Notifications"}
                            </Text>
                            <Badge count={notifBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('updates')}
                            style={[styles.tab, {
                                borderBottomColor: activeTab === 'updates' ? colors.tint : 'transparent',
                                flexDirection: isRTL ? 'row-reverse' : 'row'
                            }]}
                        >
                            <Text style={[styles.tabText, {
                                color: activeTab === 'updates' ? colors.tint : colors.muted,
                                fontWeight: activeTab === 'updates' ? 'bold' : 'normal'
                            }]}>
                                {isRTL ? "מה חדש?" : "What's New?"}
                            </Text>
                            <Badge count={updatesBadge} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {activeTab === 'notifications' ? (
                        <FlatList
                            data={notifications}
                            style={{ flex: 1 }}
                            keyExtractor={i => i.id}
                            contentContainerStyle={{ padding: 16 }}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 20 }}>
                                    {isRTL ? 'אין התראות חדשות' : 'No new notifications'}
                                </Text>
                            }
                            renderItem={({ item }) => {
                                const isNew = sessionThreshold
                                    ? new Date(item.created_at) > new Date(sessionThreshold)
                                    : true;

                                // SWAPPED LOGIC: We want "Read" items to have the emphasized style
                                const isEmphasized = !isNew;

                                return (
                                    <View
                                        style={[styles.item, {
                                            // Base style for all (bold/highlighted look)
                                            backgroundColor: (colors.primary + '10'),
                                            borderColor: isEmphasized ? colors.primary : colors.border,
                                            borderWidth: isEmphasized ? 1 : 1,

                                            // Side strip logic
                                            borderLeftWidth: isRTL ? (isEmphasized ? 1 : 0) : 4,
                                            borderRightWidth: isRTL ? 4 : (isEmphasized ? 1 : 0),
                                            borderLeftColor: colors.primary,
                                            borderRightColor: colors.primary,

                                            // Extra "Pop" for emphasized items (which are now the READ ones)
                                            shadowColor: isEmphasized ? colors.primary : "transparent",
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: isEmphasized ? 0.2 : 0,
                                            shadowRadius: 4,
                                            elevation: isEmphasized ? 4 : 0,
                                            transform: isEmphasized ? [{ scale: 1.02 }] : [],
                                            marginHorizontal: isEmphasized ? 4 : 0,
                                        }]}
                                    >
                                        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                            <Text style={[styles.itemTitle, { color: colors.text, fontWeight: 'bold', width: '90%', textAlign: isRTL ? 'right' : 'left' }]}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.itemBody, { color: colors.muted, textAlign: isRTL ? 'right' : 'left', marginTop: 4 }]}>
                                                {item.body}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>
                                                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            }}
                        />

                    ) : (
                        <View style={{ padding: 24, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
                                {isRTL ? "כאן יופעו ויוסברו כל העדכונים של האפליקציה." : "All application updates will be shown and explained here."}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        borderRadius: 16,
        borderWidth: 1,
        height: '70%',
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
    },
    header: {
        padding: 10,
        alignItems: 'flex-end', // Close button always on end
        paddingHorizontal: 16
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 16,
    },
    item: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
    },
    itemTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    itemBody: {
        fontSize: 14,
        lineHeight: 20,
    },
});
