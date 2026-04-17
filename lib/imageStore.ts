import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_DIR = `${FileSystem.documentDirectory}task-images/`;
const MAX_IMAGES = 5;

export type TaskImage = {
  id: string;
  localPath: string;
  filename: string;
  sort_order: number;
};

function storageKey(todoId: number) {
  return `turbotodo-images-${todoId}`;
}

async function ensureDir(todoId: number) {
  const dir = `${IMAGE_DIR}${todoId}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

export async function getImages(todoId: number): Promise<TaskImage[]> {
  const raw = await AsyncStorage.getItem(storageKey(todoId));
  if (!raw) return [];
  try { return JSON.parse(raw) as TaskImage[]; }
  catch { return []; }
}

export async function addImages(todoId: number, uris: string[]): Promise<TaskImage[]> {
  const existing = await getImages(todoId);
  const slots = MAX_IMAGES - existing.length;
  const toAdd = uris.slice(0, slots);
  const dir = await ensureDir(todoId);

  const added: TaskImage[] = [];
  for (let i = 0; i < toAdd.length; i++) {
    const uri = toAdd[i];
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const id = `${Date.now()}-${i}`;
    const filename = `${id}.${ext}`;
    const localPath = `${dir}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: localPath });
    added.push({ id, localPath, filename, sort_order: existing.length + i });
  }

  const updated = [...existing, ...added];
  await AsyncStorage.setItem(storageKey(todoId), JSON.stringify(updated));
  return updated;
}

export async function deleteImage(todoId: number, id: string): Promise<TaskImage[]> {
  const existing = await getImages(todoId);
  const target = existing.find(img => img.id === id);
  if (target) {
    try { await FileSystem.deleteAsync(target.localPath, { idempotent: true }); } catch {}
  }
  const updated = existing.filter(img => img.id !== id);
  await AsyncStorage.setItem(storageKey(todoId), JSON.stringify(updated));
  return updated;
}

export async function deleteImagesForTodo(todoId: number): Promise<void> {
  const existing = await getImages(todoId);
  for (const img of existing) {
    try { await FileSystem.deleteAsync(img.localPath, { idempotent: true }); } catch {}
  }
  const dir = `${IMAGE_DIR}${todoId}/`;
  try { await FileSystem.deleteAsync(dir, { idempotent: true }); } catch {}
  await AsyncStorage.removeItem(storageKey(todoId));
}

export { MAX_IMAGES };
