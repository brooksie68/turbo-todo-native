import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../lib/theme';
import { initDB } from '../lib/db';

// Initialize local SQLite DB on startup
initDB();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider><ThemeProvider><Slot /></ThemeProvider></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
