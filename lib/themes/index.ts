import type { Theme } from '../theme';
import defaultTheme from './default';
import darkSlateTheme from './dark-slate';
import deepBlue from './deep-blue';
import biminiBreeze from './bimini-breeze';
import forestCanopy from './forest-canopy';
import muirLight from './muir-light';
import biomech from './biomech';

// Add new themes here — one import above, one entry below. That's it.
// Set enabled: false in the theme file to hide it from the picker without deleting it.
export const themes: Record<string, Theme> = {
  'default':        defaultTheme,
  'dark-slate':     darkSlateTheme,
  'deep-blue':      deepBlue,
  'bimini-breeze':  biminiBreeze,
  'forest-canopy':  forestCanopy,
  'muir-light':     muirLight,
  'biomech':        biomech,
};
