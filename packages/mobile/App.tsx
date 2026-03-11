import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    primaryContainer: '#d1e4ff',
    secondary: '#625b71',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#fafafa',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90caf9',
    primaryContainer: '#004a77',
    secondary: '#ccc2dc',
    surface: '#1e1e1e',
    surfaceVariant: '#2c2c2c',
    background: '#121212',
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const { init, loading } = useAuthStore();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => { init(); }, []);

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
