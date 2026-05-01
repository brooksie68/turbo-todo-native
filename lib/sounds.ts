import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'turbotodo-sounds';

const soundFiles: Record<string, any> = {
  'task-complete':    require('../assets/sounds/task-complete.mp3'),
  'subtask-complete': require('../assets/sounds/subtask-complete.mp3'),
  'task-create':      require('../assets/sounds/task-create.mp3'),
  'subtask-create':   require('../assets/sounds/subtask-create.mp3'),
  'list-create':      require('../assets/sounds/list-create.mp3'),
  'task-delete':      require('../assets/sounds/task-delete.mp3'),
  'expand-all':       require('../assets/sounds/expand-all.mp3'),
  'collapse-all':     require('../assets/sounds/collapse-all.mp3'),
  'drag-drop':        require('../assets/sounds/drag-drop.mp3'),
  'priority-set':     require('../assets/sounds/priority-set.mp3'),
  'notification':     require('../assets/sounds/notification.mp3'),
  'error':            require('../assets/sounds/error.mp3'),
};

// In-memory cache of enabled state — loaded once on app start
let _enabled = false;

export async function loadSoundSetting(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  _enabled = val === 'on';
  return _enabled;
}

export function isSoundEnabled(): boolean {
  return _enabled;
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  _enabled = enabled;
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
}

export async function playSound(name: keyof typeof soundFiles) {
  if (!_enabled) return;
  try {
    const { sound } = await Audio.Sound.createAsync(soundFiles[name]);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (e) {
    // fail silently — sounds are non-critical
  }
}
