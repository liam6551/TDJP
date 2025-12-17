import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { t } from '@/shared/i18n';
import { useLang } from '@/shared/state/lang';
import { Ionicons } from '@expo/vector-icons';

interface TariffSuccessDialogProps {
    visible: boolean;
    onFinish: () => void;
}

export function TariffSuccessDialog({ visible, onFinish }: TariffSuccessDialogProps) {
    const { colors } = useAppTheme();
    const { lang } = useLang();

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onFinish();
            }, 2000); // 2 seconds delay
            return () => clearTimeout(timer);
        }
    }, [visible, onFinish]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: '#15803d' }]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={64} color="#15803d" />
                    </View>
                    <Text style={[styles.text, { color: colors.text }]}>
                        {lang === 'he' ? 'הטריף נשמר בהצלחה !' : 'Tariff saved successfully!'}
                    </Text>
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
    },
    dialog: {
        width: 250,
        borderRadius: 20,
        padding: 30,
        borderWidth: 2,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconContainer: {
        marginBottom: 16,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
