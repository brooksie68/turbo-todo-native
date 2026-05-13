import type { Theme } from '../theme';

const capeCodSunset: Theme = {
  id: 'cape-cod-sunset',
  name: 'Cape Cod Sunset',
  enabled: true,
  statusBarStyle: 'dark',

  // Backgrounds
  bg: '#ffbe30',
  headerBg: '#ffbe30',
  surface: '#172735d9',        // scroll area gradient first stop at 85% opacity (gradient: #172735→#744325 @85%)
  menuBg: '#2a1a0e',           // ⚠ no named layer — palette-inferred dark warm

  // Gradient
  gradientColors: ['#172735d9', '#744325d9'],
  gradientLocations: [0, 1],

  // Borders
  border: '#025f96',
  headerBorder: '#d4b24d',
  footerBorder: '#43350c',
  separator: '#7b5e29',
  listSelectorBorder: '#c67739',

  // Text
  text: '#f5e6c8',             // ⚠ no named layer — palette-inferred warm light
  textSub: '#c9a870',          // ⚠ no named layer — palette-inferred muted warm
  textDone: '#977f5d',
  textDepth: ['#da9d44', '#bf8530', '#ffc064'],

  // Interactive
  accent: '#025f96',           // ⚠ no named layer — ocean blue (matches border + row icons)
  danger: '#f02109',

  // Icons
  iconColor: '#fcaf51',
  iconGradient: null,

  // Priority
  priorityElevated: '#ff8600',
  priorityTop: '#f02109',

  // List selector
  listSelectorBg: '#795139',
  listSelectorText: '#ffffff',

  // Checkbox
  checkboxBg: '#454036',
  checkboxDone: '#6a3f1f',
  checkmarkColor: '#eae2ca',

  // Extended
  backgroundImage: require('../../assets/backgrounds/capecod.png'),
  fontFamily: null,
};

export default capeCodSunset;
