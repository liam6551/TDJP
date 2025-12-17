import React, { useState, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useAuth } from '@/shared/state/auth';
import GuestHome from '../components/GuestHome';
import UserHome from '../components/UserHome';
import ExitAppConfirmModal from '@/shared/ui/ExitAppConfirmModal';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const [showExitModal, setShowExitModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setShowExitModal(true);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar titleKey="screens.home" />
      {user ? <UserHome /> : <GuestHome />}
      <ExitAppConfirmModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
