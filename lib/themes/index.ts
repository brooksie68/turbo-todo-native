import type { Theme } from '../theme';
import defaultTheme from './default';
import darkSlateTheme from './dark-slate';
import deepBlue from './deep-blue';
import biminiBreeze from './bimini-breeze';
import forestCanopy from './forest-canopy';
import muirLight from './muir-light';
import biomech from './biomech';
import capeCodSunset from './cape-cod-sunset';

// Light themes first (L1→), then dark themes (D1→). Add new themes to bottom of each group.
// Set enabled: false in the theme file to hide it from the picker without deleting it.
export const themes: Record<string, Theme> = {
  // Light
  'default':          defaultTheme,      // L1
  'forest-canopy':    forestCanopy,      // L2
  'bimini-breeze':    biminiBreeze,      // L3
  'muir-light':       muirLight,         // L4
  // Dark
  'dark-slate':       darkSlateTheme,    // D1
  'deep-blue':        deepBlue,          // D2
  'biomech':          biomech,           // D3
  'cape-cod-sunset':  capeCodSunset,     // D4
};
