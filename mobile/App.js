import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';

// Extend MD3LightTheme so Paper v5 has all required tokens (e.g. elevation.level3)
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    background: theme.colors.background,
    surface: theme.colors.surface,
    error: theme.colors.error,
    onSurface: theme.colors.text,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <AppNavigator />
          </CartProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
