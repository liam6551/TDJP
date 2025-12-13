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

    // Update Timestamp on Tab View
    useEffect(() => {
        if (visible && user?.id) {
            const now = new Date().toISOString();
            if (activeTab === 'notifications') {
                SecureStore.setItemAsync(`lastViewedNotifs_${user.id}`, now);
                setLastViewedNotifs(now);
            } else if (activeTab === 'updates') {
                SecureStore.setItemAsync(`lastViewedUpdates_${user.id}`, now);
                setLastViewedUpdates(now);
            }
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
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { }}>

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
                                borderBottomColor: activeTab === 'notifications' ? colors.primary : 'transparent',
                                flexDirection: isRTL ? 'row-reverse' : 'row'
                            }]}
                        >
                            <Text style={[styles.tabText, {
                                color: activeTab === 'notifications' ? colors.primary : colors.muted,
                                fontWeight: activeTab === 'notifications' ? 'bold' : 'normal'
                            }]}>
                                {isRTL ? "התראות" : "Notifications"}
                            </Text>
                            <Badge count={notifBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('updates')}
                            style={[styles.tab, {
                                borderBottomColor: activeTab === 'updates' ? colors.primary : 'transparent',
                                flexDirection: isRTL ? 'row-reverse' : 'row'
                            }]}
                        >
                            <Text style={[styles.tabText, {
                                color: activeTab === 'updates' ? colors.primary : colors.muted,
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
                                const meta = item.metadata;
                                const isVerification = meta?.type === 'verification';

                                return (
                                    <View
                                        style={[styles.item, {
                                            backgroundColor: (colors.primary + '10'), // Always "unread" bg
                                            borderColor: colors.border,
                                            borderLeftWidth: isRTL ? 0 : 4,
                                            borderRightWidth: isRTL ? 4 : 0,
                                            borderLeftColor: colors.primary, // Always "unread" color
                                            borderRightColor: colors.primary,
                                        }]}
                                    >
                                        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                            <Text style={[styles.itemTitle, { color: colors.text, fontWeight: 'bold' }]}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.itemBody, { color: colors.muted, textAlign: isRTL ? 'right' : 'left' }]}>
                                                {item.body}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>
                                                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                                            </Text>

                                            {isVerification && (
                                                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 12 }}>
                                                    <TouchableOpacity
                                                        onPress={() => onAction('approve', meta.userId)}
                                                        style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
                                                    >
                                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{isRTL ? 'אשר' : 'Approve'}</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => onAction('reject', meta.userId)}
                                                        style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                                    >
                                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{isRTL ? 'דחה' : 'Reject'}</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => onAction('edit', meta.userId)}
                                                        style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                                                    >
                                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{isRTL ? 'ערוך' : 'Edit'}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
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
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        borderRadius: 16,
        borderWidth: 1,
        height: '70%',
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
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
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
