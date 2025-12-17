import React from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/theme';
import { LangProvider, useLang } from '@/shared/state/lang';
import RootStack from '@/app/navigation/RootStack';

import { AuthProvider } from '@/shared/state/auth';

import { CopilotProvider } from 'react-native-copilot';
import { TutorialTooltip } from '@/features/onboarding/components/TutorialTooltip';

function WithNav() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const navTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      primary: colors.tint,
      text: colors.text,
      card: colors.card,
      border: 'transparent',
      notification: colors.tint,
    },
  };

  return (
    <NavigationContainer key={`${lang}-${isRTL ? 'rtl' : 'ltr'}`} theme={navTheme}>
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider defaultMode="light">
          <LangProvider defaultLang="he">
            <CopilotProvider
              tooltipComponent={TutorialTooltip}
              stepNumberComponent={() => null}
              overlay="view"
              animated={true}
              arrowColor="transparent"
              labels={{ finish: "סיום", next: "הבא", previous: "הקודם", skip: "דלג" }}
            >
              <AuthProvider>
                <WithNav />
              </AuthProvider>
            </CopilotProvider>
          </LangProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
