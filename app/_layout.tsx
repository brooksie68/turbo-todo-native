import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { ThemeProvider } from '../lib/theme';
import { initDB } from '../lib/db';
import { runMidnightCheck } from '../lib/dailyList';

initDB();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (!__DEV__) {
        try {
          const check = await Updates.checkForUpdateAsync();
          if (check.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
            return; // reloadAsync restarts the app — nothing below runs
          }
        } catch {}
      }
      await runMidnightCheck();
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider><ThemeProvider><Slot /></ThemeProvider></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
