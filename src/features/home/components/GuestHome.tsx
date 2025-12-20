import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Platform, Image, Animated } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager } from 'react-native';
import Svg, { Path, Defs, Mask, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GuestHome() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const navigation = useNavigation<any>();
    const isRTL = lang === 'he';

    // Intro State: 0=hidden, 1=black, 2=twist, 3=button
    const [introStep, setIntroStep] = useState(0);
    const [spotlightVisible, setSpotlightVisible] = useState(false);

    // Animations
    const twistOpacity = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;

    // We store the target button's layout here
    const [targetRect, setTargetRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const buttonRef = useRef<View>(null);

    const measureButton = () => {
        if (buttonRef.current) {
            buttonRef.current.measureInWindow((x, y, width, height) => {
                setTargetRect({ x, y, w: width, h: height });
            });
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            const checkTutorial = async () => {
                const pending = await AsyncStorage.getItem('pending_guest_tutorial');
                if (pending === 'true' && active) {
                    await AsyncStorage.removeItem('pending_guest_tutorial');
                    // Start Intro Sequence
                    setIntroStep(1); // Black screen start

                    setTimeout(() => {
                        if (!active) return;
                        setIntroStep(2); // Show Twist
                        Animated.timing(twistOpacity, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true
                        }).start();

                        setTimeout(() => {
                            if (!active) return;
                            setIntroStep(3); // Show Button
                            Animated.timing(buttonOpacity, {
                                toValue: 1,
                                duration: 800,
                                useNativeDriver: true
                            }).start();
                        }, 1000); // 1s delay for button
                    }, 1000); // 1s delay for twist
                }
            };
            checkTutorial(); // Call immediatly

            return () => {
                active = false;
                setIntroStep(0);
                setSpotlightVisible(false);
                twistOpacity.setValue(0);
                buttonOpacity.setValue(0);
            };
        }, [])
    );

    const handleStartTutorial = () => {
        measureButton();
        setIntroStep(0); // Close intro
        setSpotlightVisible(true); // Open spotlight
    };

    const handleLoginPress = () => {
        setSpotlightVisible(false);
        navigation.navigate('Login');
    };

    const LoginButton = () => (
        <TouchableOpacity
            onPress={handleLoginPress}
            activeOpacity={0.8}
            style={{ width: '100%', alignItems: 'center' }}
        >
            <LinearGradient
                colors={['#FF8C00', '#FF0080']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
            >
                <Text style={styles.btnText}>
                    {t(lang, 'home.loginAction')}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { alignItems: 'center' }]}>
                <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
                    {t(lang, 'home.guestTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7, textAlign: 'center' }]}>
                    {t(lang, 'home.guestSubtitle')}
                </Text>
            </View>

            {/* Normal Button Container with Ref */}
            <View
                style={{ width: '100%' }}
                ref={buttonRef}
                onLayout={() => {
                    // Optional: remeasure on layout changes if needed, but measureInWindow usually needs a specific trigger
                }}
            >
                <LoginButton />
            </View>

            {/* Twist Intro Modal */}
            <Modal
                visible={introStep > 0}
                transparent={false} // Black background covers everything
                animationType="fade"
                onRequestClose={() => setIntroStep(0)}
            >
                <View style={styles.introContainer}>
                    {introStep >= 2 && (
                        <>
                            {/* Speech Bubble with Text - Moved outside twistContainer to be absolute top */}
                            <Animated.View style={[styles.bubbleContainer, { opacity: twistOpacity }]}>
                                <Image
                                    source={require('../../../assets/images/twist/empty_speech_bubble_left.png')}
                                    style={styles.bubbleImage}
                                    resizeMode="stretch"
                                />
                                <View style={styles.bubbleContent}>
                                    <Text style={styles.bubbleText}>
                                        שלום, הגעתם לאפליקציה TDJP - TumblingDifficultyJudgePro.{'\n'}
                                        אני טוויסט, ואני שופט בינלאומי בטאמבלינג !{'\n'}
                                        אני יודע כל מה שקשור בענף הזה כל עוד הוא מופיע בחוקה.{'\n'}
                                        כרגע תפקידי הוא להציג לכם את האפליקציה ולעזור לכם בעת הצורך, מאוחר יותר אם תרצו תהייה לכם האופציה לשאול אותי שאלות על הענף.{'\n'}
                                        למה אתם מחכים? בואו נתחיל את ההדרכה !
                                    </Text>
                                </View>
                            </Animated.View>

                            <Animated.View style={[styles.twistContainer, { opacity: twistOpacity }]}>
                                {/* Twist Image */}
                                <Image
                                    source={require('../../../assets/images/twist/hands_behind_back-removebg-preview.png')}
                                    style={styles.twistImage}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </>
                    )}

                    {introStep >= 3 && (
                        <Animated.View style={{ opacity: buttonOpacity }}>
                            <TouchableOpacity onPress={handleStartTutorial} style={styles.startTutorialBtn}>
                                <Text style={styles.startTutorialText}>התחל הדרכה</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
            </Modal>

            {/* SVG Mask Overlay */}
            <Modal
                visible={spotlightVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleLoginPress}
            >
                {/* SVG Mask Layer */}
                <View style={StyleSheet.absoluteFill}>
                    <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={StyleSheet.absoluteFill}>
                        <Defs>
                            <Mask id="mask">
                                {/* 1. Base: White = Fully Visible Overlay */}
                                <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />

                                {(() => {
                                    if (!targetRect) return null;

                                    const START_OFFSET = 10;   // Outside (+10px) -> White (Visible)
                                    const END_OFFSET = -20;    // Inside (-20px) -> Black (Transparent)
                                    const STEPS = 30;
                                    const TOTAL_DIST = START_OFFSET - END_OFFSET; // 30px span

                                    const elements = [];
                                    const BASE_RADIUS = 28;

                                    const getPath = (offset: number) => {
                                        const r = Math.max(0, BASE_RADIUS + offset);
                                        const x = targetRect.x - offset;
                                        const y = targetRect.y - offset;
                                        const w = targetRect.w + (offset * 2);
                                        const h = targetRect.h + (offset * 2);
                                        return `M${x + r},${y} ` +
                                            `L${x + w - r},${y} ` +
                                            `A${r},${r} 0 0 1 ${x + w},${y + r} ` +
                                            `L${x + w},${y + h - r} ` +
                                            `A${r},${r} 0 0 1 ${x + w - r},${y + h} ` +
                                            `L${x + r},${y + h} ` +
                                            `A${r},${r} 0 0 1 ${x},${y + h - r} ` +
                                            `L${x},${y + r} ` +
                                            `A${r},${r} 0 0 1 ${x + r},${y}`;
                                    };

                                    // 2. The Core Hole: Black = Fully Transparent
                                    // Everything inside the END_OFFSET is pure black
                                    elements.push(
                                        <Path
                                            key="core-hole"
                                            d={getPath(END_OFFSET)}
                                            fill="black"
                                        />
                                    );

                                    // 3. Gradient Rings: Black (Inside) -> White (Outside)
                                    // We iterate from END_OFFSET (Inside) outwards to START_OFFSET (Outside)
                                    // This paints over the white base with darkening rings closer to the center
                                    for (let i = 0; i <= STEPS; i++) {
                                        const ratio = i / STEPS; // 0 (Inside) -> 1 (Outside)

                                        // Position
                                        const currentOffset = END_OFFSET + (ratio * TOTAL_DIST);

                                        // Color calculation
                                        // Inside (ratio 0) -> Black (0)
                                        // Outside (ratio 1) -> White (255)
                                        // Use cubic ease for that "soft/dimmed" look the user liked
                                        const ease = Math.pow(ratio, 3);
                                        const val = Math.round(255 * ease);
                                        const color = `rgb(${val},${val},${val})`;

                                        elements.push(
                                            <Path
                                                key={`grad-${i}`}
                                                d={getPath(currentOffset)}
                                                stroke={color}
                                                strokeWidth={(TOTAL_DIST / STEPS) + 0.5}
                                                fill="none"
                                            />
                                        );
                                    }

                                    return elements;
                                })()}
                            </Mask>
                        </Defs>

                        {/* Apply the Mask to a single dark overlay Rect */}
                        {/* This eliminates all seams/frames because it's just one rectangle being masked */}
                        <Rect
                            x="0" y="0"
                            width={SCREEN_WIDTH} height={SCREEN_HEIGHT}
                            fill="rgba(0,0,0,0.85)"
                            mask="url(#mask)"
                        />
                    </Svg>
                </View>

                {/* Content Overlay */}
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }]}>
                    {targetRect && (
                        <>
                            {/* Invisible Touchable on the button */}
                            <TouchableOpacity
                                style={{
                                    position: 'absolute',
                                    left: targetRect.x,
                                    top: targetRect.y,
                                    width: targetRect.w,
                                    height: targetRect.h,
                                    borderRadius: 28,
                                }}
                                onPress={handleLoginPress}
                            />
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        gap: 40,
    },
    header: {
        gap: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '400',
        lineHeight: 26,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF0080',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Styles for Twist Intro
    introContainer: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'flex-end', // Push everything to bottom
        paddingBottom: 0, // Touch bottom
    },
    twistContainer: {
        flexDirection: 'column', // Stack vertically
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 0,
    },
    twistImage: {
        width: 400, // Massive
        height: 600,
        resizeMode: 'contain',
        zIndex: 5,
        marginBottom: -120, // Even lower
    },
    startTutorialBtn: {
        position: 'absolute',
        bottom: 120, // Keep overlap
        alignSelf: 'center',
        paddingVertical: 16,
        paddingHorizontal: 50,
        backgroundColor: '#FF0080',
        borderRadius: 30,
        shadowColor: "#FF0080",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 100,
    },
    startTutorialText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    bubbleContainer: {
        position: 'absolute',
        top: 60, // Relative to screen top
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: 380, // Slightly reduced to fit screen width safely
        height: 320,
        zIndex: 20, // Higher Z to sit above everything
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    bubbleContent: {
        paddingHorizontal: 40,
        paddingVertical: 50,
        paddingBottom: 60,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    bubbleText: {
        color: 'black',
        fontSize: 11, // Even smaller (was 13)
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 18, // Reduced line height slightly
    }
});
