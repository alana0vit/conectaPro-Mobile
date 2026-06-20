import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from "@react-navigation/native"
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/toastConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </SafeAreaView>
  );
}
