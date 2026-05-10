import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { ThemeProvider } from '../lib/theme';
import { initDB } from '../lib/db';
import { runMidnightCheck } from '../lib/dailyList';

initDB();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'IBMPlexMono-Regular':        require('../assets/fonts/IBMPlexMono-Regular.ttf'),
    'IBMPlexMono-Medium':         require('../assets/fonts/IBMPlexMono-Medium.ttf'),
    'IBMPlexMono-SemiBold':       require('../assets/fonts/IBMPlexMono-SemiBold.ttf'),
    'IBMPlexMono-Bold':           require('../assets/fonts/IBMPlexMono-Bold.ttf'),
    'IBMPlexMono-Italic':         require('../assets/fonts/IBMPlexMono-Italic.ttf'),
    'IBMPlexMono-BoldItalic':     require('../assets/fonts/IBMPlexMono-BoldItalic.ttf'),
  });

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

  if (!ready || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider><ThemeProvider><Slot /></ThemeProvider></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
