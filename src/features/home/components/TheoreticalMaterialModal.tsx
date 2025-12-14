import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';



type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function TheoreticalMaterialModal({ visible, onClose }: Props) {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const isRTL = lang === 'he';
    const [fontsLoaded] = useFonts({ FrankRuhlLibre_700Bold });
    const navigation = useNavigation();

    if (!visible) return null;

    const items = [
        {
            id: 'code',
            icon: 'globe-outline',
            titleKey: 'home.theoretical.code',
            url: 'https://www.google.com' // Dummy URL for now
        },
        {
            id: 'ageGroups',
            icon: 'calendar-outline',
            titleKey: 'home.theoretical.ageGroups',
            url: 'https://www.google.com'
        },
        {
            id: 'technical',
            icon: 'clipboard-outline',
            titleKey: 'home.theoretical.technical',
            url: 'https://www.google.com'
        }
    ];

    const handleOpen = (item: any) => {
        if (item.id === 'code') {
            onClose();
            // @ts-ignore
            navigation.navigate('InternationalCode');
        } else {
            // Linking.openURL(item.url); 
            console.log('Opening:', item.url);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlayContainer}>
                {/* Backdrop - No onPress to prevent closing if desired, or add onClose */}
                <View style={styles.backdrop} />

                {/* Content Card */}
                <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {t(lang, 'home.theoretical.title')}
                        </Text>
                    </View>

                    {/* Body */}
                    <ScrollView contentContainerStyle={styles.body}>
                        <View style={{ gap: 16 }}>
                            {items.map((item, idx) => (
                                <View key={idx} style={[styles.card, {
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                    flexDirection: isRTL ? 'row-reverse' : 'row'
                                }]}>
                                    {/* Icon & Title */}
                                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <View style={{
                                            width: 40, height: 40, borderRadius: 20,
                                            backgroundColor: colors.tint + '20',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Ionicons name={item.icon as any} size={22} color={colors.tint} />
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                                            {t(lang, item.titleKey)}
                                        </Text>
                                    </View>

                                    {/* Action Button */}
                                    <TouchableOpacity
                                        onPress={() => handleOpen(item)}
                                        style={{
                                            backgroundColor: colors.tint,
                                            paddingVertical: 8, paddingHorizontal: 16,
                                            borderRadius: 8
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                                            {t(lang, 'home.theoretical.open')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Bottom Close Button */}
                    <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBigBtn, { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                                {t(lang, 'common.close')}
                            </Text>
                        </TouchableOpacity>
                    </View>

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
        height: '60%', // Slightly smaller than quiz? Or same? User said "same size frame". Quiz was 80%. Let's start with 60% as list is short.
        maxHeight: 500, // Cap height
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
    },
    header: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 16
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    body: { padding: 16, paddingBottom: 80 },
    card: {
        padding: 12, borderRadius: 12, borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    bottomBar: {
        position: 'absolute', bottom: 0, width: '100%',
        padding: 12, borderTopWidth: 1, elevation: 10
    },
    closeBigBtn: {
        width: '100%', height: 44, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center'
    }
});
