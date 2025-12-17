
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = {
    visible: boolean;
    onClose: () => void;
    onConnect: () => void;
};

export default function GuestAccessModal({ visible, onClose, onConnect }: Props) {
    const { colors } = useAppTheme();
    const { lang } = useLang();

    // Translations
    const title = t(lang, 'dialogs.guestAccess.title');
    const message = t(lang, 'dialogs.guestAccess.message');
    const cancelText = t(lang, 'dialogs.guestAccess.cancel');
    const connectText = t(lang, 'dialogs.guestAccess.connect');

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>

                    {/* Icon / Header Graphic could go here if requested, but sticking to text for now as per "ExitModal" style */}

                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

                    <View style={styles.actions}>
                        {/* Cancel Button (Secondary) */}
                        <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnSecondary, { borderColor: colors.border }]}>
                            <Text style={[styles.btnText, { color: colors.text, opacity: 0.8 }]}>{cancelText}</Text>
                        </TouchableOpacity>

                        {/* Connect Button (Primary) */}
                        <TouchableOpacity onPress={onConnect} style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.tint }]}>
                            <Text style={[styles.btnText, { color: '#fff' }]}>{connectText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialog: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        opacity: 0.9,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    btnPrimary: {
        // bg set inline
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
