import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useAppTheme, Mode } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { tutorial } from '@/shared/state/tutorial'; // We will create this

export default function OnboardingScreen() {
    const { colors, setMode, mode } = useAppTheme();
    const { lang, setLang } = useLang();
    const navigation = useNavigation<any>();

    // Texts based on current lang (Immediate Feedback)
    const strings = {
        he: {
            welcome: 'ברוכים הבאים!',
            subtitle: 'בואו נתאים את האפליקציה אליכם',
            language: 'שפה',
            theme: 'ערכת נושא',
            themeLight: 'בהיר',
            themeDark: 'כהה',
            themeBlue: 'כחול',
            start: 'התחל סיור באפליקציה',
            skip: 'דלג וכנס לאפליקציה'
        },
        en: {
            welcome: 'Welcome!',
            subtitle: "Let's customize your experience",
            language: 'Language',
            theme: 'Theme',
            themeLight: 'Light',
            themeDark: 'Dark',
            themeBlue: 'Blue',
            start: 'Start Tour',
            skip: 'Skip & Enter App'
        }
    };

    const t = strings[lang as 'he' | 'en'] || strings.he;
    const isRTL = lang === 'he';

    const handleStart = async (withTutorial: boolean) => {
        await AsyncStorage.setItem('@did_onboarding', 'true');
        navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs', params: { startTutorial: withTutorial } }],
        });
    };

    const activeBorderColor = (mode === 'dark' || mode === 'blue') ? '#FFA500' : '#FF8C00'; // Lighter orange for dark modes

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{t.welcome}</Text>
                    <View style={{ width: '100%', paddingHorizontal: 32, alignItems: 'center' }}>
                        <Text
                            style={[styles.subtitle, { color: colors.text, opacity: 0.7, flexShrink: 1 }]}
                            numberOfLines={0}
                        >
                            {t.subtitle}
                        </Text>
                    </View>
                </View>

                {/* Language Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.language}</Text>
                    <View style={styles.row}>
                        <TouchableOpacity
                            onPress={() => setLang('he')}
                            style={[styles.optionCard, lang === 'he' && styles.selectedOption, lang === 'he' && { borderColor: activeBorderColor }, { backgroundColor: colors.card, borderColor: lang === 'he' ? activeBorderColor : colors.border }]}
                        >
                            <Text style={[styles.optionText, { color: colors.text }]}>🇮🇱 עברית</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setLang('en')}
                            style={[styles.optionCard, lang === 'en' && styles.selectedOption, lang === 'en' && { borderColor: activeBorderColor }, { backgroundColor: colors.card, borderColor: lang === 'en' ? activeBorderColor : colors.border }]}
                        >
                            <Text style={[styles.optionText, { color: colors.text }]}>🇺🇸 English</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Theme Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.theme}</Text>
                    <View style={styles.row}>
                        {/* Light */}
                        <TouchableOpacity onPress={() => setMode('light')} style={[styles.themeCircle, mode === 'light' && styles.selectedTheme]}>
                            <View style={[styles.circleInner, { backgroundColor: '#ffffff', borderColor: mode === 'light' ? activeBorderColor : '#ddd', borderWidth: mode === 'light' ? 2 : 1 }]} />
                            <Text style={[styles.themeLabel, { color: colors.text }]}>{t.themeLight}</Text>
                        </TouchableOpacity>

                        {/* Blue */}
                        <TouchableOpacity onPress={() => setMode('blue')} style={[styles.themeCircle, mode === 'blue' && styles.selectedTheme]}>
                            <View style={[styles.circleInner, { backgroundColor: '#0e1a2b', borderColor: mode === 'blue' ? activeBorderColor : '#ddd', borderWidth: mode === 'blue' ? 2 : 1 }]} />
                            <Text style={[styles.themeLabel, { color: colors.text }]}>{t.themeBlue}</Text>
                        </TouchableOpacity>

                        {/* Dark */}
                        <TouchableOpacity onPress={() => setMode('dark')} style={[styles.themeCircle, mode === 'dark' && styles.selectedTheme]}>
                            <View style={[styles.circleInner, { backgroundColor: '#111111', borderColor: mode === 'dark' ? activeBorderColor : '#ddd', borderWidth: mode === 'dark' ? 2 : 1 }]} />
                            <Text style={[styles.themeLabel, { color: colors.text }]}>{t.themeDark}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />

                {/* Actions */}
                <TouchableOpacity onPress={() => handleStart(true)} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#FF8C00', '#FF0080']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mainBtn}
                    >
                        <Text style={styles.mainBtnText}>{t.start}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleStart(false)} style={styles.skipBtn}>
                    <Text style={[styles.skipText, { color: colors.muted }]}>{t.skip}</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 40, alignItems: 'center', width: '100%' },
    title: { fontSize: 32, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 18, textAlign: 'center', flexWrap: 'wrap', paddingHorizontal: 20 },
    section: { marginBottom: 32, width: '100%', alignItems: 'center' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
    optionCard: {
        width: 140, // Fixed width
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedOption: {
        borderColor: '#FF8C00',
        borderWidth: 2,
    },
    optionText: { fontSize: 18, fontWeight: '600' },
    themeCircle: { alignItems: 'center', gap: 8 },
    circleInner: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#ddd' },
    selectedTheme: { transform: [{ scale: 1.1 }] },
    themeLabel: { fontSize: 14, fontWeight: '500' },
    mainBtn: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#FF0080',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        minWidth: 250,
    },
    mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    skipBtn: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        width: '100%',
    },
    skipText: { fontSize: 16, textDecorationLine: 'underline', textAlign: 'center' }
});
