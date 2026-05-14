import type { Theme } from '../theme';

const capeCodSunset: Theme = {
  id: 'cape-cod-sunset',
  name: 'Cape Cod Sunset',
  enabled: true,
  themeClass: 'dark',
  themeLabel: 'D4',
  statusBarStyle: 'light',
  statusBarBg: 'transparent',  // image bleeds into status bar; fallback solid: #0e2839
  appBgLayer: { type: 'image', source: require('../../assets/backgrounds/capecod.png') },
  scrollAreaBg: { type: 'gradient', colors: ['#172735d9', '#744325d9'], locations: [0, 1] },

  headerBg: '#0e2839',
  headerBorder: '#d4b24d',
  menuBg: '#2a1a0e',
  border: '#025f96',
  footerBorder: '#43350c',
  separator: '#7b5e29',
  listSelectorBg: '#795139',
  listSelectorText: '#ffffff',
  listSelectorBorder: '#c67739',
  text: '#f5e6c8',
  textSub: '#c9a870',
  textDone: '#977f5d',
  textDepth: ['#da9d44', '#bf8530', '#ffc064'],
  accent: '#025f96',
  danger: '#f02109',
  iconColor: '#fcaf51',
  priorityElevated: '#ff8600',
  priorityTop: '#f02109',
  checkboxBg: '#454036',
  checkboxDone: '#6a3f1f',
  checkmarkColor: '#eae2ca',
  iconGradient: null,
  fontFamily: null,
};

export default capeCodSunset;
