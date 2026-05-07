import type { Theme } from '../theme';
import defaultTheme from './default';
import default2Theme from './default-2';
import darkSlateTheme from './dark-slate';
import slateTheme from './slate';
import biminiBreeze from './bimini-breeze';

// Add new themes here — one import above, one entry below. That's it.
// Set enabled: false in the theme file to hide it from the picker without deleting it.
export const themes: Record<string, Theme> = {
  'default':        defaultTheme,
  'default-2':      default2Theme,
  'dark-slate':     darkSlateTheme,
  'slate':          slateTheme,
  'bimini-breeze':  biminiBreeze,
};
