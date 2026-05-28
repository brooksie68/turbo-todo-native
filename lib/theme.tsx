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

// ─── Background layer types ───────────────────────────────────
export type SolidBg    = { type: 'solid';    color: string };
export type GradientBg = { type: 'gradient'; colors: string[]; locations: number[] };
export type ImageBg    = { type: 'image';    source: number }; // source = require()'d asset (number)
export type AppBgLayer  = SolidBg | GradientBg | ImageBg;
export type ScrollAreaBg = SolidBg | GradientBg;

// ─── Theme type ───────────────────────────────────────────────
// Every theme must supply all tokens. See lib/themes/*.ts for values.
// See themes.md for the full token reference and authoring workflow.
export type Theme = {
  id: string;
  name: string;
  enabled: boolean;            // false = hidden from picker but still loadable
  themeClass: 'light' | 'dark';
  themeLabel: string;          // 'L1', 'L2', ... / 'D1', 'D2', ...
  statusBarStyle: 'dark' | 'light';
  statusBarBg: string | 'transparent';

  // Layer 1 — full-screen opaque base (solid color, gradient, or photo)
  appBgLayer: AppBgLayer;
  // Layer 2 — reserved: optional semi-opaque tint above appBgLayer, below scroll area (not yet implemented)
  // Layer 3 — scroll area rectangle (solid or gradient, any opacity)
  scrollAreaBg: ScrollAreaBg;

  // Other backgrounds
  headerBg: string | null;     // header bar background — null = no header bg
  footerBg: string | null;     // toolbar/footer background — null = no footer bg
  menuBg: string;              // bottom sheet / dropdown backgrounds

  // Borders
  scrollAreaBorder: string;    // scroll area, modals, dropdowns, inputs
  checkboxBorder: string;      // checkbox borders (unchecked and checked)
  headerBorder: string;        // 1px line under header
  footerBorder: string;        // 1px line above toolbar
  separator: string;           // row separator lines
  listSelectorBorder: string;  // list selector underline

  // Text
  text: string;                // primary body text
  textNote: string;            // note / secondary text
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
  checkboxDoneBg: string;      // checked checkbox fill
  checkmarkColor: string;      // SVG checkmark color inside done checkbox

  // Extended visual tokens (optional — null = not used)
  iconGradient: [string, string] | null;  // top→bottom gradient on all iconColor icons; overrides iconColor when set
  fontFamily: string | null;               // custom font family name; null = system default
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
