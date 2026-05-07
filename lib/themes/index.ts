import type { Theme } from '../theme';
import defaultTheme from './default';
import darkSlateTheme from './dark-slate';
import slateTheme from './slate';
import biminiBreeze from './bimini-breeze';

// Add new themes here — one import above, one entry below. That's it.
// Set enabled: false in the theme file to hide it from the picker without deleting it.
export const themes: Record<string, Theme> = {
  'default':        defaultTheme,
  'dark-slate':     darkSlateTheme,
  'slate':          slateTheme,
  'bimini-breeze':  biminiBreeze,
};
