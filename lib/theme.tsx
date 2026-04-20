import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = {
  id: string;
  name: string;
  bg: string;
  headerBg: string;
  headerBorder: string;
  surface: string;
  border: string;
  text: string;
  textSub: string;
  textDone: string;
  textDepth: [string, string, string];
  accent: string;
  danger: string;
  priorityElevated: string;
  priorityTop: string;
  iconColor: string;
  listSelectorBg: string;
  listSelectorText: string;
  listSelectorBorder: string;
  checkboxBg: string;
  checkboxDone: string;
  separator: string;
  gradientColors: string[] | null;
  gradientLocations: number[] | null;
};

export const themes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default',
    bg: '#003759',
    headerBg: '#F6CD75',
    headerBorder: '#e0c060',
    surface: '#eae2ca',
    border: '#c7ba9b',
    text: '#3d2e21',
    textSub: '#725f4b',
    textDone: '#b0a08a',
    textDepth: ['#1a1008', '#3d2e21', '#5a4535'],
    accent: '#6a3f1f',
    danger: '#9e3a2a',
    priorityElevated: '#c96a00',
    priorityTop: '#b52a1a',
    iconColor: '#025f96',
    listSelectorBg: '#ffe8a9',
    listSelectorText: '#00395b',
    listSelectorBorder: '#023455',
    checkboxBg: '#fffdf5',
    checkboxDone: '#6a3f1f',
    separator: '#d9ccb4',
    gradientColors: ['#ffcb58', '#eeddba', '#ffbe30'],
    gradientLocations: [0, 0.5, 1],
  },
  'bimini-breeze': {
    id: 'bimini-breeze',
    name: 'Bimini Breeze',
    bg: '#004455',
    headerBg: '#c8f0e8',
    headerBorder: '#8ecdc0',
    surface: '#f0fbf7',
    border: '#8ecdc0',
    text: '#1a3a35',
    textSub: '#2a7060',
    textDone: '#99c4bb',
    textDepth: ['#1a3a35', '#2a7060', '#2a7060'],
    accent: '#00998a',
    danger: '#cc3300',
    priorityElevated: '#ff8800',
    priorityTop: '#cc2200',
    iconColor: '#007766',
    listSelectorBg: '#dff5ee',
    listSelectorText: '#1a3a35',
    listSelectorBorder: '#00998a',
    checkboxBg: '#f0fbf7',
    checkboxDone: '#007766',
    separator: '#b0ddd4',
    gradientColors: ['#fdf5e0', '#c8f0e8', '#7dd8cc'],
    gradientLocations: [0, 0.6, 1],
  },
};

type ThemeContextType = {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.default,
  themeId: 'default',
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState('default');

  useEffect(() => {
    AsyncStorage.getItem('turbotodo-theme').then(saved => {
      if (saved && themes[saved]) setThemeIdState(saved);
    });
  }, []);

  function setThemeId(id: string) {
    if (!themes[id]) return;
    setThemeIdState(id);
    AsyncStorage.setItem('turbotodo-theme', id);
  }

  return (
    <ThemeContext.Provider value={{ theme: themes[themeId], themeId, setThemeId }}>
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
