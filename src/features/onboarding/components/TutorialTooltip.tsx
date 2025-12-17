import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
// @ts-ignore
import { TooltipProps } from 'react-native-copilot';
import { TUTORIAL_DATA, TWIST_IMAGES } from '../data/tutorialData';
import { useAppTheme } from '@/shared/theme/theme';

const { width } = Dimensions.get('window');

export const TutorialTooltip = ({
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrev,
    handleStop,
    currentStep,
}: TooltipProps) => {
    const { colors } = useAppTheme();

    if (!currentStep) return null;

    // Get data for this step
    const stepName = currentStep.name;
    const data = TUTORIAL_DATA[stepName];

    if (!data) return null;

    return (
        <View style={styles.container}>
            {/* Character - Absolute positioned to "pop out" */}
            <View style={styles.characterContainer}>
                <Image
                    source={TWIST_IMAGES[data.pose] || TWIST_IMAGES.point_right}
                    style={styles.characterImage}
                    resizeMode="contain"
                />
            </View>

            {/* Speech Bubble */}
            <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.text, { color: colors.text }]}>
                    {data.text}
                </Text>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleStop} style={styles.skipBtn}>
                        <Text style={[styles.skipText, { color: colors.muted }]}>דלג</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                        <Text style={styles.nextText}>{isLastStep ? 'סיום' : 'הבא'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 40, // Space for character head
        alignItems: 'center',
        width: width * 0.8,
    },
    characterContainer: {
        position: 'absolute',
        top: -60,
        right: -20, // Twist stands on the right
        zIndex: 10,
        elevation: 10,
    },
    characterImage: {
        width: 120,
        height: 120,
    },
    bubble: {
        padding: 20,
        paddingTop: 20,
        borderRadius: 16,
        borderWidth: 1,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
        writingDirection: 'rtl',
        textAlign: 'right', // Hebrew
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    skipBtn: {
        padding: 8,
    },
    skipText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    nextBtn: {
        backgroundColor: '#FF8C00',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    nextText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
