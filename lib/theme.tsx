import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from './themes';

// ─── Text sizes ───────────────────────────────────────────────
// index 0 = small, 1 = normal (default), 2 = large, 3 = xlarge, 4 = xxlarge
const TEXT_SIZES = [
  { d0: 14, d1: 13, d2: 12 }, // small
  { d0: 16, d1: 15, d2: 14 }, // normal
  { d0: 18, d1: 17, d2: 16 }, // large
  { d0: 20, d1: 19, d2: 18 }, // xlarge
  { d0: 22, d1: 21, d2: 20 }, // xxlarge
];
export const TEXT_SIZE_COUNT = TEXT_SIZES.length;

// ─── Theme type ───────────────────────────────────────────────
// Every theme must supply all tokens. See lib/themes/*.ts for values.
// See themes.md for the full token reference and authoring workflow.
export type Theme = {
  id: string;
  name: string;
  enabled: boolean;            // false = hidden from picker but still loadable
  statusBarStyle: 'dark' | 'light';

  // Backgrounds
  bg: string;                  // app bg fallback (when no gradient)
  headerBg: string;            // header bar background (reserved — not yet used in code)
  surface: string;             // card / scroll area / modal backgrounds
  menuBg: string;              // bottom sheet / dropdown backgrounds
  gradientColors: string[];    // ThemeBg gradient stops (min 2)
  gradientLocations: number[]; // gradient stop positions (must match gradientColors length)

  // Borders
  border: string;              // general borders, inputs, scroll area
  headerBorder: string;        // 1px line under header
  footerBorder: string;        // 1px line above toolbar
  separator: string;           // row separator lines
  listSelectorBorder: string;  // list selector underline

  // Text
  text: string;                // primary body text
  textSub: string;             // secondary / note text
  textDone: string;            // struck-through completed item text
  textDepth: [string, string, string]; // task text by depth [d0, d1, d2]

  // Interactive / semantic
  accent: string;              // active states, modal titles, active list item
  danger: string;              // destructive actions, invalid drag indicator
  iconColor: string;           // all toolbar and row icons

  // Priority indicators
  priorityElevated: string;    // bolt icon / elevated status text
  priorityTop: string;         // exclamation icon / top-priority text

  // List selector
  listSelectorBg: string;      // list selector background
  listSelectorText: string;    // list selector text + arrow

  // Checkbox
  checkboxBg: string;          // unchecked checkbox fill
  checkboxDone: string;        // checked checkbox fill + border
  checkmarkColor: string;      // SVG checkmark color inside done checkbox

  // Extended visual tokens (optional — null = not used)
  iconGradient: [string, string] | null;  // top→bottom gradient on all iconColor icons; overrides iconColor when set
  backgroundImage: number | null;          // require()'d image asset; gradient overlays on top as tint
};

export { themes };

// ─── Context ──────────────────────────────────────────────────
type ThemeContextType = {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  textSizeIndex: number;
  setTextSizeIndex: (index: number) => void;
  fontSizes: { d0: number; d1: number; d2: number };
};

const ThemeContext = createContext<ThemeContextType>({
  theme: themes['default'],
  themeId: 'default',
  setThemeId: () => {},
  textSizeIndex: 1,
  setTextSizeIndex: () => {},
  fontSizes: TEXT_SIZES[1],
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState('default');
  const [textSizeIndex, setTextSizeIndexState] = useState(1);

  useEffect(() => {
    AsyncStorage.getItem('turbotodo-theme').then(saved => {
      if (saved && themes[saved]) setThemeIdState(saved);
    });
    AsyncStorage.getItem('turbotodo-text-size').then(saved => {
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx)) setTextSizeIndexState(Math.max(0, Math.min(TEXT_SIZE_COUNT - 1, idx)));
      }
    });
  }, []);

  function setThemeId(id: string) {
    if (!themes[id]) return;
    setThemeIdState(id);
    AsyncStorage.setItem('turbotodo-theme', id);
  }

  function setTextSizeIndex(index: number) {
    const clamped = Math.max(0, Math.min(TEXT_SIZE_COUNT - 1, index));
    setTextSizeIndexState(clamped);
    AsyncStorage.setItem('turbotodo-text-size', String(clamped));
  }

  return (
    <ThemeContext.Provider value={{
      theme: themes[themeId],
      themeId,
      setThemeId,
      textSizeIndex,
      setTextSizeIndex,
      fontSizes: TEXT_SIZES[textSizeIndex],
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext).theme;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
