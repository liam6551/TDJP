
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { t } from '@/shared/i18n';
import { useLang } from '@/shared/state/lang';

interface TariffSaveDialogProps {
    visible: boolean;
    initialName?: string;
    loading?: boolean;
    onSave: (name: string) => void;
    onCancel: () => void;
}

export function TariffSaveDialog({ visible, initialName = '', loading = false, onSave, onCancel }: TariffSaveDialogProps) {
    const { colors, mode } = useAppTheme();
    const { lang } = useLang();
    const isRTL = lang === 'he';
    const [name, setName] = useState(initialName);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setName(initialName);
            setError('');
        }
    }, [visible, initialName]);

    const handleSave = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError(t(lang, 'tariff.saveDialog.errorEmpty'));
            return;
        }
        onSave(trimmed);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t(lang, 'tariff.saveDialog.title')}
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: colors.text,
                                backgroundColor: colors.bg,
                                borderColor: error ? '#ff3b30' : colors.border,
                                textAlign: isRTL ? 'right' : 'left'
                            }
                        ]}
                        value={name}
                        onChangeText={(t) => { setName(t); setError(''); }}
                        placeholder={t(lang, 'tariff.saveDialog.placeholder')}
                        placeholderTextColor={colors.muted}
                    />

                    {!!error && (
                        <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {error}
                        </Text>
                    )}

                    <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Pressable
                            style={[styles.btn, { backgroundColor: colors.border }]}
                            onPress={onCancel}
                            disabled={loading}
                        >
                            <Text style={[styles.btnText, { color: colors.text }]}>
                                {t(lang, 'tariff.saveDialog.cancel')}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.btn, { backgroundColor: '#15803d' }]} // Green for save
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.btnText}>
                                    {t(lang, 'tariff.saveDialog.save')}
                                </Text>
                            )}
                        </Pressable>
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
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 8,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 14,
        marginBottom: 12,
    },
    actions: {
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
