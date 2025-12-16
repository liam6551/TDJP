import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, Animated, Easing, Pressable } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { Ionicons } from '@expo/vector-icons';
import { useQuizRun } from '@/features/quiz/hooks/useQuizRun';
import { ELEMENTS } from '@/shared/data/elements';
import { ElementItem, QuizConfig } from '@/features/quiz/types';
import McqOption from '@/features/quiz/components/McqOption';
import QuestionHeader from '@/features/quiz/components/QuestionHeader';
import { useAudioPlayer } from 'expo-audio';
import { useFonts, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';
import { Svg, G, Circle, Path } from 'react-native-svg';
import he from '@/shared/i18n/he';
import en from '@/shared/i18n/en';
import { StatsService } from '@/shared/services/stats';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function QuickQuizModal({ visible, onClose }: Props) {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const [fontsLoaded] = useFonts({ FrankRuhlLibre_700Bold });

    // Force re-mount on open to reset state
    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { /* Prevent hardware back close if desired, or allow */ }}>
            <View style={styles.overlayContainer}>
                {/* Backdrop - No onPress to prevent closing */}
                <View style={styles.backdrop} />

                {/* Content Card */}
                <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <QuickQuizRunner
                        onClose={onClose}
                        colors={colors}
                        lang={lang}
                        fontsLoaded={fontsLoaded}
                    />
                </View>
            </View>
        </Modal>
    );
}

function QuickQuizRunner({ onClose, colors, lang, fontsLoaded }: any) {
    const isRTL = lang === 'he';

    // Config: Custom, MCQ, Symbol, Down Arrow (Symbol->Value), 10 Qs, 10s Timer
    const config: QuizConfig = useMemo(() => ({
        mode: 'custom',
        count: 10,
        timer: 10,
        form: 'mcq',
        prompt: 'symbol',
        mapping: 'elementToValue', // Symbol -> Value
    }), []);

    const list = useMemo<ElementItem[]>(() => ELEMENTS as unknown as ElementItem[], []);

    // Audio
    const successPlayer = useAudioPlayer(require('../../../../assets/success.mp3'));
    const failPlayer = useAudioPlayer(require('../../../../assets/fail.mp3'));

    const playSuccess = () => { successPlayer.seekTo(0); successPlayer.play(); };
    const playFail = () => { failPlayer.seekTo(0); failPlayer.play(); };

    const { state, selectedId, remaining, locked, onChoose, onSubmit, next } = useQuizRun(list, config, lang);
    const [statusById, setStatusById] = useState<Record<string, 'idle' | 'correct' | 'wrong'>>({});

    // Reset per question
    useEffect(() => {
        setStatusById({});
    }, [state.index]);

    const handleOptionPress = (optId: string) => {
        if (locked) return;
        onChoose(optId);
        const q = state.questions[state.index];
        const isCorrect = optId === q.correct.id;

        const newStatus: any = {};
        q.options!.forEach(o => {
            if (o.id === q.correct.id) newStatus[o.id] = 'correct';
        });
        if (!isCorrect) newStatus[optId] = 'wrong';

        setStatusById(newStatus);

        if (isCorrect) playSuccess();
        else playFail();

        onSubmit(optId);
        setTimeout(() => next(), 2000);
    };

    // Auto-submit on timeout
    useEffect(() => {
        if (remaining === 0 && !locked && state.questions[state.index]) {
            const q = state.questions[state.index];
            const newStatus: any = {};
            q.options!.forEach(o => {
                if (o.id === q.correct.id) newStatus[o.id] = 'correct';
            });
            setStatusById(newStatus);
            playFail(); // Time out is fail
            onSubmit(null);
            setTimeout(() => next(), 2000);
        }
    }, [remaining, locked]);


    // RENDER SUMMARY if finished
    if (state.finished) {
        return (
            <QuickQuizSummary
                results={state.results}
                total={state.questions.length}
                onClose={onClose}
                colors={colors}
                lang={lang}
                fontsLoaded={fontsLoaded}
                isRTL={isRTL}
            />
        );
    }

    const q = state.questions[state.index];
    if (!q) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;

    // --- Timer Logic ---
    const size = 48;
    const stroke = 5;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const timeLimitSec = 10;
    const ratio = Math.max(0, Math.min(1, remaining / timeLimitSec));
    const offset = c * (1 - ratio);
    const cx = size / 2;
    const cy = size / 2;
    const sweep = 360 * ratio;
    const startDeg = -90;
    const endDeg = startDeg + sweep;
    const rad = (d: number) => (d * Math.PI) / 180;
    const sx = cx + r * Math.cos(rad(startDeg));
    const sy = cy + r * Math.sin(rad(startDeg));
    const ex = cx + r * Math.cos(rad(endDeg));
    const ey = cy + r * Math.sin(rad(endDeg));
    const largeArc = sweep > 180 ? 1 : 0;
    const pieD = ratio <= 0 ? '' : ratio >= 1 ? '' : `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} Z`;

    const TimerNode = (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <Circle cx={cx} cy={cy} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
                {ratio > 0 && ratio < 1 && <Path d={pieD} fill={colors.tint} />}
                {ratio >= 1 && <Circle cx={cx} cy={cy} r={r} fill={colors.tint} />}
            </Svg>
            <View style={{ position: 'absolute' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{remaining}</Text>
            </View>
        </View>
    );

    // Counter Node
    const CounterNode = (
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            {state.index + 1}/{state.questions.length}
        </Text>
    );

    return (
        <View style={styles.innerContainer}>
            {/* Header: Timer and Counter in opposite corners */}
            <View style={[styles.header, {
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                height: 'auto',
                paddingBottom: 16
            }]}>
                {/* Left Side */}
                <View style={{ alignItems: 'flex-start' }}>
                    {isRTL ? CounterNode : TimerNode}
                </View>
                {/* Right Side */}
                <View style={{ alignItems: 'flex-end' }}>
                    {isRTL ? TimerNode : CounterNode}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.body}>
                {/* Prompt */}
                <View style={styles.promptWrap}>
                    <Text style={[styles.promptTop, { color: colors.text }]}>{q.prompt}</Text>
                    <Text style={[styles.promptBig, {
                        color: colors.text,
                        fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : undefined
                    }]}>
                        {'\u2066'}{q.symbol}{'\u2069'}
                    </Text>
                </View>

                {/* Options */}
                <View style={styles.options}>
                    {q.options!.map(opt => (
                        <McqOption
                            key={opt.id}
                            label={opt.label}
                            selected={selectedId === opt.id}
                            colors={colors}
                            onPress={() => handleOptionPress(opt.id)}
                            status={statusById[opt.id] ?? 'idle'}
                            minHeight={60}
                            paddingH={12}
                            paddingV={12}
                            borderRadius={12}
                            borderWidth={2}
                            labelSize={22}
                            spacing={8}
                            align="stretch"
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Persistent Close Button for Runner */}
            <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
                <TouchableOpacity onPress={onClose} style={[styles.closeBigBtn, { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{lang === 'he' ? 'סגור' : 'Close'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// === SUMMARY COMPONENT (Local) ===
function QuickQuizSummary({ results, total, onClose, colors, lang, fontsLoaded, isRTL }: any) {
    // Calculate stats
    const correctCount = results.filter((r: any) => r.correct).length;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Animations for donut
    const [showPercent, setShowPercent] = useState(false);
    const flip = useRef(new Animated.Value(0)).current;

    const onPressDonut = () => {
        const to = showPercent ? 0 : 1;
        Animated.timing(flip, { toValue: to, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        setShowPercent(!showPercent);
    };

    const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
    const frontOpacity = flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });
    const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });

    // === Save Stats Logic ===
    React.useEffect(() => {
        const saveStats = async () => {
            if (!results || results.length === 0) return;

            const statsPayload = results.map((r: any) => {
                // qid format: "template:elementId" or "open:template:elementId"
                const parts = r.qid.split(':');
                const elementId = parts[parts.length - 1]; // ID is always last

                // Find element for difficulty value
                // QuickQuiz uses ELEMENTS direct import usually
                const elem = (ELEMENTS as unknown as ElementItem[]).find(e => String(e.id) === String(elementId));
                const diff = elem ? Number(elem.value) : 0;

                return {
                    elementId,
                    isCorrect: !!r.correct,
                    difficulty: isNaN(diff) ? 0 : diff
                };
            });

            console.log('[QuickQuiz] Saving stats for', statsPayload.length, 'items');
            await StatsService.saveResults(statsPayload);
        };

        saveStats();
    }, [results]);

    return (
        <View style={styles.innerContainer}>
            <View style={[styles.header, { justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16, height: 'auto' }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {lang === 'he' ? 'סיכום' : 'Summary'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }}>
                <View style={{ height: 10 }} />
                <Text style={[styles.title, { color: colors.text }]}>
                    {lang === 'he' ? 'המבחן הושלם!' : 'Quiz Completed!'}
                </Text>

                <Pressable onPress={onPressDonut} style={styles.donutWrap}>
                    <Donut size={150} strokeWidth={14} correct={correctCount} total={total} colors={colors} />
                    <View style={StyleSheet.absoluteFill}>
                        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: frontOpacity, transform: [{ rotateY: frontRotate }] }]}>
                            <Text style={[styles.donutCenter, { color: colors.text }]}>{correctCount}/{total}</Text>
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: backOpacity, transform: [{ rotateY: backRotate }] }]}>
                            <Text style={[styles.donutCenter, { color: colors.text }]}>{percent}%</Text>
                        </Animated.View>
                    </View>
                </Pressable>

                {/* List of Results */}
                <View style={{ width: '100%', paddingHorizontal: 16, gap: 10 }}>
                    {results.map((r: any, idx: number) => {
                        const [rowId] = r.qid.split(':').slice(-1);
                        const item = (ELEMENTS as unknown as ElementItem[]).find(e => String(e.id) === String(rowId));

                        const isUnanswered = r.selectedId === null || r.selectedId === undefined;
                        let statusText = '';
                        let statusColor = colors.text;

                        if (r.correct) {
                            statusText = lang === 'he' ? 'נכון' : 'Correct';
                            statusColor = '#22c55e';
                        } else if (isUnanswered) {
                            statusText = lang === 'he' ? 'לא נענה' : 'Unanswered';
                            statusColor = colors.muted;
                        } else {
                            statusText = lang === 'he' ? 'שגוי' : 'Wrong';
                            statusColor = '#ef4444';
                        }

                        return (
                            <View key={idx} style={[styles.card, {
                                borderColor: statusColor, // Border matches status
                                backgroundColor: colors.card,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center', // Ensures vertical centering of flex items
                                justifyContent: 'space-between'
                            }]}>
                                {/* Right Side (Symbol + Status) */}
                                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
                                    <Text style={[styles.cardSymbol, {
                                        fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : undefined,
                                        color: colors.text,
                                        fontSize: 28
                                    }]}>
                                        {item?.symbol}
                                    </Text>
                                    <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 16 }}>
                                        {statusText}
                                    </Text>
                                </View>

                                {/* Left Side (User Answer) */}
                                <View style={{ justifyContent: 'center', alignItems: 'center', minWidth: 40, paddingTop: isUnanswered ? 4 : 0 }}>
                                    {isUnanswered ? (
                                        <View style={{ width: 24, height: 2, backgroundColor: colors.text, borderRadius: 1 }} />
                                    ) : (
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                                            {r.selectedText || '-'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Bottom Close Button */}
            <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
                <TouchableOpacity onPress={onClose} style={[styles.closeBigBtn, { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{lang === 'he' ? 'סגור' : 'Close'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function Donut({ size, strokeWidth, correct, total, colors }: any) {
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = total > 0 ? correct / total : 0;
    const correctLen = pct * circumference;
    return (
        <Svg width={size} height={size}>
            <G rotation={-90} originX={cx} originY={cy}>
                <Circle cx={cx} cy={cy} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
                <Circle cx={cx} cy={cy} r={radius} stroke="#22c55e" strokeWidth={strokeWidth}
                    strokeDasharray={`${correctLen} ${circumference}`} strokeLinecap="round" fill="none" />
            </G>
        </Svg>
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
        height: '80%',
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
    },
    innerContainer: {
        flex: 1,
    },
    header: { height: 60, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 8, paddingTop: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    // closeBtn removed
    body: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 80 }, // increased bottom pad for button
    promptWrap: { alignItems: 'center', marginBottom: 16 },
    promptTop: { fontSize: 16, marginBottom: 4 },
    promptBig: { fontSize: 36 },
    options: { gap: 10 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
    donutWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    donutCenter: { fontSize: 24, fontWeight: 'bold' },
    card: {
        padding: 10, borderRadius: 12, borderWidth: 1,
        gap: 12
    },
    cardSymbol: { fontSize: 22 },
    bottomBar: {
        position: 'absolute', bottom: 0, width: '100%',
        padding: 12, borderTopWidth: 1, elevation: 10
    },
    closeBigBtn: {
        width: '100%', height: 44, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center'
    }
});
