import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { zip, unzip } from 'react-native-zip-archive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from './db';
import { getAllImages } from './imageStore';
import type { TaskImage } from './imageStore';

const IMAGE_DIR = `${FileSystem.documentDirectory}task-images/`;

function buildTimestamp(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`;
}

// Recursively find the first .json file inside a directory
async function findJson(dir: string): Promise<string | null> {
  let files: string[];
  try {
    files = await FileSystem.readDirectoryAsync(dir);
  } catch {
    return null;
  }
  for (const f of files) {
    if (f.endsWith('.json')) return `${dir}${f}`;
  }
  // Check one level of subdirectories (zip may include the folder itself)
  for (const f of files) {
    const sub = `${dir}${f}/`;
    const info = await FileSystem.getInfoAsync(sub);
    if (info.exists && (info as any).isDirectory) {
      const found = await findJson(sub);
      if (found) return found;
    }
  }
  return null;
}

// ── Export ───────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<void> {
  const ts = buildTimestamp();
  const baseName = `turbotodo-backup-${ts}`;
  const tempDir = `${FileSystem.cacheDirectory}${baseName}/`;
  const zipPath = `${FileSystem.cacheDirectory}${baseName}.zip`;

  try {
    // Read all structured data
    const lists = await db.getAllAsync('SELECT * FROM lists ORDER BY sort_order, inserted_at');
    const todos = await db.getAllAsync('SELECT * FROM todos ORDER BY list_id, sort_order, inserted_at');
    const taskLinks = await db.getAllAsync('SELECT * FROM task_links ORDER BY todo_id, sort_order');

    // Collect image metadata for depth-1 items
    const rootIds = new Set((todos as any[]).filter(t => t.parent_id === null).map(t => t.id));
    const depth1Ids = (todos as any[]).filter(t => t.parent_id !== null && rootIds.has(t.parent_id)).map(t => t.id);
    const imageMap = depth1Ids.length > 0 ? await getAllImages(depth1Ids) : {};

    // Build image index (metadata only — actual files go into the zip)
    const imageIndex: Record<string, { id: string; filename: string; sort_order: number }[]> = {};
    for (const [todoId, images] of Object.entries(imageMap)) {
      if (images.length > 0) {
        imageIndex[todoId] = images.map(img => ({
          id: img.id,
          filename: img.filename,
          sort_order: img.sort_order,
        }));
      }
    }

    // Write JSON into temp dir
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    await FileSystem.writeAsStringAsync(
      `${tempDir}${baseName}.json`,
      JSON.stringify({ version: 1, exported_at: new Date().toISOString(), lists, todos, task_links: taskLinks, images: imageIndex }),
      { encoding: FileSystem.EncodingType.UTF8 },
    );

    // Copy image files into temp dir alongside the JSON
    for (const [todoId, images] of Object.entries(imageMap)) {
      if (images.length === 0) continue;
      const destDir = `${tempDir}images/${todoId}/`;
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      for (const img of images) {
        const info = await FileSystem.getInfoAsync(img.localPath);
        if (info.exists) {
          await FileSystem.copyAsync({ from: img.localPath, to: `${destDir}${img.filename}` });
        }
      }
    }

    // Zip everything and share
    await zip(tempDir, zipPath);
    await Sharing.shareAsync(zipPath, {
      mimeType: 'application/zip',
      dialogTitle: 'Save TurboTodo backup',
      UTI: 'public.zip-archive',
    });
  } finally {
    FileSystem.deleteAsync(tempDir, { idempotent: true }).catch(() => {});
    FileSystem.deleteAsync(zipPath, { idempotent: true }).catch(() => {});
  }
}

// ── Import ───────────────────────────────────────────────────────────────────

// Returns true if restore succeeded, false if user cancelled.
// Throws on validation/IO error.
export async function importBackup(): Promise<boolean> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.[0]) return false;

  const extractDir = `${FileSystem.cacheDirectory}restore-${Date.now()}/`;

  try {
    await unzip(picked.assets[0].uri, extractDir);

    // Locate the JSON (zip may wrap contents in a subdirectory)
    const jsonPath = await findJson(extractDir);
    if (!jsonPath) throw new Error('Invalid backup: no JSON found');

    const jsonDir = jsonPath.substring(0, jsonPath.lastIndexOf('/') + 1);
    const backup = JSON.parse(
      await FileSystem.readAsStringAsync(jsonPath, { encoding: FileSystem.EncodingType.UTF8 }),
    );

    if (backup.version !== 1 || !Array.isArray(backup.lists) || !Array.isArray(backup.todos)) {
      throw new Error('Invalid backup file');
    }

    // Wipe all existing images from filesystem + AsyncStorage
    await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true }).catch(() => {});
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    const allKeys = await AsyncStorage.getAllKeys();
    const imageKeys = allKeys.filter(k => k.startsWith('turbotodo-images-'));
    if (imageKeys.length > 0) await AsyncStorage.multiRemove(imageKeys);

    // Wipe SQLite (FK order: links → todos → lists)
    db.execSync('DELETE FROM task_links; DELETE FROM todos; DELETE FROM lists;');

    // Restore lists
    for (const row of backup.lists) {
      await db.runAsync(
        'INSERT INTO lists (id, name, sort_order, inserted_at) VALUES (?, ?, ?, ?)',
        [row.id, row.name, row.sort_order, row.inserted_at],
      );
    }

    // Restore todos
    for (const row of backup.todos) {
      await db.runAsync(
        'INSERT INTO todos (id, list_id, parent_id, task, note, is_complete, status, sort_order, inserted_at, pinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.list_id, row.parent_id, row.task, row.note, row.is_complete, row.status, row.sort_order, row.inserted_at, row.pinned ?? 0],
      );
    }

    // Restore task_links
    for (const row of backup.task_links ?? []) {
      await db.runAsync(
        'INSERT INTO task_links (id, todo_id, url, name, sort_order) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.todo_id, row.url, row.name, row.sort_order],
      );
    }

    // Restore images
    if (backup.images && typeof backup.images === 'object') {
      for (const [todoId, images] of Object.entries(backup.images as Record<string, any[]>)) {
        const destDir = `${IMAGE_DIR}${todoId}/`;
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });

        const restored: TaskImage[] = [];
        for (const img of images) {
          const src = `${jsonDir}images/${todoId}/${img.filename}`;
          const info = await FileSystem.getInfoAsync(src);
          if (info.exists) {
            const dest = `${destDir}${img.filename}`;
            await FileSystem.copyAsync({ from: src, to: dest });
            restored.push({ id: img.id, localPath: dest, filename: img.filename, sort_order: img.sort_order });
          }
        }

        if (restored.length > 0) {
          await AsyncStorage.setItem(`turbotodo-images-${todoId}`, JSON.stringify(restored));
        }
      }
    }

    return true;
  } finally {
    FileSystem.deleteAsync(extractDir, { idempotent: true }).catch(() => {});
  }
}
