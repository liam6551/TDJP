
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TariffScreen from '@/features/tariff';
import SavedTariffsScreen from '@/features/tariff/screens/SavedTariffsScreen';

const Stack = createNativeStackNavigator();

export default function TariffStack() {
    return (
        <Stack.Navigator
            initialRouteName="TariffHome"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right'
            }}
        >
            <Stack.Screen name="TariffHome" component={TariffScreen} />
            <Stack.Screen name="SavedTariffs" component={SavedTariffsScreen} />
        </Stack.Navigator>
    );
}
