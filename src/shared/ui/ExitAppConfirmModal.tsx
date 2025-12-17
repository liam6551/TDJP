import React from 'react'
import { Modal, View, Text, StyleSheet, Pressable, BackHandler } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '@/shared/theme/theme'
import { useLang } from '@/shared/state/lang'
import { t } from '@/shared/i18n'

type Props = {
    visible: boolean
    onCancel: () => void
}

export default function ExitAppConfirmModal({
    visible,
    onCancel,
}: Props) {
    const { colors } = useAppTheme()
    const { lang } = useLang()
    const isRTL = lang === 'he'

    const handleExit = () => {
        BackHandler.exitApp();
    }

    if (!visible) return null

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.panel,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name="log-out-outline" size={28} color="#FFFFFF" />
                    </View>

                    <Text
                        style={[
                            styles.title,
                            {
                                color: colors.text,
                                textAlign: 'center',
                            },
                        ]}
                    >
                        {t(lang, 'dialogs.exitApp.title')}
                    </Text>

                    <Text
                        style={[
                            styles.message,
                            {
                                color: colors.text,
                                textAlign: isRTL ? 'right' : 'left',
                            },
                        ]}
                    >
                        {t(lang, 'dialogs.exitApp.message')}
                    </Text>

                    <View
                        style={[
                            styles.buttonsRow,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        ]}
                    >
                        {/* Stay Button - Blue */}
                        <Pressable
                            onPress={onCancel}
                            style={({ pressed }) => [
                                styles.button,
                                {
                                    backgroundColor: colors.tint,
                                    borderColor: colors.tint,
                                    opacity: pressed ? 0.9 : 1,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.buttonText,
                                    { color: '#ffffff' },
                                ]}
                            >
                                {t(lang, 'dialogs.exitApp.stay')}
                            </Text>
                        </Pressable>

                        {/* Exit Button - Red */}
                        <Pressable
                            onPress={handleExit}
                            style={({ pressed }) => [
                                styles.button,
                                {
                                    backgroundColor: '#ef4444',
                                    borderColor: '#ef4444',
                                    opacity: pressed ? 0.9 : 1,
                                },
                            ]}
                        >
                            <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                                {t(lang, 'dialogs.exitApp.exit')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    panel: {
        minWidth: 280,
        maxWidth: '85%',
        borderRadius: 20,
        borderWidth: 1.5,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: 'center',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 20,
        textAlign: 'center'
    },
    buttonsRow: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
    },
})
