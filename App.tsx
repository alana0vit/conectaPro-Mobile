import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { NavigationContainer } from "@react-navigation/native"
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/toastConfig';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { navigationRef } from './src/navigation/navigationRef';
import { ChatWidgetMount } from './src/components/ChatWidgetMount';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string | undefined>();

  const syncRoute = () =>
    setCurrentRoute(navigationRef.getCurrentRoute()?.name);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <NavigationContainer
          ref={navigationRef}
          onReady={syncRoute}
          onStateChange={syncRoute}
        >
          <AppNavigator />
          <ChatWidgetMount routeName={currentRoute} />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
