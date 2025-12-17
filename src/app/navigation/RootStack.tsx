import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Tabs from '@/app/navigation/Tabs';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import AdminUsersScreen from '@/features/admin/screens/AdminUsersScreen';
import EditUserScreen from '@/features/admin/screens/EditUserScreen';
import InternationalCodeScreen from '@/features/home/screens/InternationalCodeScreen';
import AIChatScreen from '@/features/ai/screens/AIChatScreen';
import ProgressScreen from '@/features/progress/screens/ProgressScreen';



const Stack = createNativeStackNavigator();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen';

export default function RootStack() {
  const [initialRoute, setInitialRoute] = React.useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem('@did_onboarding').then(value => {
      setInitialRoute(value === 'true' ? 'Tabs' : 'Onboarding');
    });
  }, []);

  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="EditUser" component={EditUserScreen} />
      <Stack.Screen name="InternationalCode" component={InternationalCodeScreen} />
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />

    </Stack.Navigator>
  );
}
