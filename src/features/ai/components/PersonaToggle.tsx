import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { Ionicons } from '@expo/vector-icons';

type PersonaMode = 'twist' | 'discussion' | 'flicki';

interface Props {
    activePersona: PersonaMode;
    onToggle: (p: PersonaMode) => void;
}

export default function PersonaToggle({ activePersona, onToggle }: Props) {
    const { lang } = useLang();

    // COMPACT DESIGN: Icons Only.
    // Width ~150px. 3 segments of 50px.
    const SEGMENT_WIDTH = 50;
    // Add explicit padding for the track to match the indicator offset.
    const PADDING = 4;
    const TOTAL_WIDTH = (SEGMENT_WIDTH * 3) + (PADDING * 2);

    const getPosIndex = (p: PersonaMode) => {
        if (p === 'twist') return 0;
        if (p === 'discussion') return 1;
        return 2;
    };

    const animValue = useRef(new Animated.Value(getPosIndex(activePersona))).current;

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: getPosIndex(activePersona),
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [activePersona]);

    // TranslateX starts at PADDING (4) and moves by SEGMENT_WIDTH
    const translateX = animValue.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [PADDING, PADDING + SEGMENT_WIDTH, PADDING + (SEGMENT_WIDTH * 2)],
    });

    const containerBg = animValue.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['#3b82f6', '#8b5cf6', '#f97316']
    });

    const getIconColor = (btnIndex: number) => {
        const isActive = getPosIndex(activePersona) === btnIndex;
        if (isActive) return '#fff';
        return '#94a3b8';
    };

    return (
        <View style={styles.container}>
            {/* Added paddingLeft/Right of 4 explicitly via style or padding prop */}
            <View style={[styles.track, { width: TOTAL_WIDTH, paddingHorizontal: PADDING }]}>
                {/* Sliding Indicator */}
                <Animated.View style={[
                    styles.indicator,
                    {
                        width: SEGMENT_WIDTH,
                        transform: [{ translateX: translateX }],
                        // Note: translateX is absolute position relative to parent? 
                        // No, in a flex container with padding, absolute children position from the padding edge?
                        // Actually, absolute position left: 0 is the border edge. 
                        // So if we use translateX, we need it to be from 0.
                        // If outputRange is [4, 54, 104], that means 4px from left edge.
                        // Our buttons are inside the padding flow.
                        // Button 1 starts at x=4. Button 2 at x=54.
                        // Indicator at x=4. Perfect overlap.
                        left: 0, // Reset any default
                        backgroundColor: containerBg,
                    }
                ]} />

                {/* Twist Icon */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.optionBtn, { width: SEGMENT_WIDTH }]}
                    onPress={() => onToggle('twist')}
                >
                    <Ionicons
                        name="glasses"
                        size={22}
                        color={getIconColor(0)}
                    />
                </TouchableOpacity>

                {/* Discussion Icon */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.optionBtn, { width: SEGMENT_WIDTH }]}
                    onPress={() => onToggle('discussion')}
                >
                    <Ionicons
                        name="people"
                        size={24}
                        color={getIconColor(1)}
                    />
                </TouchableOpacity>

                {/* Flicki Icon */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.optionBtn, { width: SEGMENT_WIDTH }]}
                    onPress={() => onToggle('flicki')}
                >
                    <Ionicons
                        name="flash"
                        size={22}
                        color={getIconColor(2)}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
    },
    track: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        position: 'relative',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    indicator: {
        position: 'absolute',
        height: 40,
        borderRadius: 20,
        top: 3, // (48 - 2 border - 40) / 2 = 3px vertical offset from inside border? 
        // Logic: height 48. borderWidth 1. content height 46. 
        // indicator 40. (46-40)/2 = 3. 
        // top: 3 works if relative to padding box? No, relative to border box usually.
        // Actually borders are insent in RN?
        // Let's assume top: 3 visually centers it.
    },
    optionBtn: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    }
});
