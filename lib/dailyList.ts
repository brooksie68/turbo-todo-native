import AsyncStorage from '@react-native-async-storage/async-storage';
import db from './db';

const DAILY_KEY = 'turbotodo-daily';

export type DailySettings = {
  enabled: boolean;
  listId: number | null;
  date: string;
};

export function getDailyDateString(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const y = String(now.getFullYear()).slice(2);
  return `${m}/${d}/${y}`;
}

export async function getDailySettings(): Promise<DailySettings | null> {
  const raw = await AsyncStorage.getItem(DAILY_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as DailySettings; } catch { return null; }
}

export async function saveDailySettings(s: DailySettings): Promise<void> {
  await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(s));
}

/**
 * Restores all daily list items that have a source back to their origin lists.
 * Natively-added items (daily_source_list_id IS NULL) are left in place —
 * they get deleted when the list is CASCADE-deleted, or explicitly by the caller.
 */
export async function restoreAllDailyItems(listId: number): Promise<void> {
  const rows = await db.getAllAsync<{
    id: number;
    is_complete: number;
    daily_source_list_id: number | null;
    daily_source_parent_id: number | null;
    daily_source_sort_order: number | null;
  }>(
    'SELECT id, is_complete, daily_source_list_id, daily_source_parent_id, daily_source_sort_order FROM todos WHERE list_id = ?',
    [listId],
  );

  for (const row of rows) {
    if (row.daily_source_list_id === null) continue; // natively added — skip

    // Validate parent still exists
    let parentId: number | null = row.daily_source_parent_id;
    if (parentId !== null) {
      const parentExists = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM todos WHERE id = ?', [parentId],
      );
      if (!parentExists) parentId = null; // parent gone — orphan as depth-0
    }

    let sortOrder: number;
    if (parentId !== null) {
      sortOrder = row.daily_source_sort_order ?? 0;
    } else {
      // Place at bottom of incomplete depth-0 items in source list
      const maxRow = await db.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(sort_order) as max FROM todos WHERE list_id = ? AND parent_id IS NULL AND is_complete = 0',
        [row.daily_source_list_id],
      );
      sortOrder = (maxRow?.max ?? -10) + 10;
    }

    await db.runAsync(
      `UPDATE todos
       SET list_id = ?, parent_id = ?, sort_order = ?,
           daily_source_list_id = NULL, daily_source_parent_id = NULL, daily_source_sort_order = NULL
       WHERE id = ?`,
      [row.daily_source_list_id, parentId, sortOrder, row.id],
    );
  }
}

/**
 * Run on app open (before render). If the daily list belongs to a previous day,
 * restore all sourced items to their origin lists, delete natively-added items,
 * and roll the list name + stored date to today.
 */
export async function runMidnightCheck(): Promise<void> {
  const settings = await getDailySettings();
  if (!settings?.enabled || !settings.listId) return;

  const today = getDailyDateString();
  if (settings.date === today) return; // already today, nothing to do

  // Restore sourced items
  await restoreAllDailyItems(settings.listId);

  // Delete natively-added items (no source)
  await db.runAsync(
    'DELETE FROM todos WHERE list_id = ? AND daily_source_list_id IS NULL',
    [settings.listId],
  );

  // Roll list name and stored date
  await db.runAsync('UPDATE lists SET name = ? WHERE id = ?', [`Daily List ${today}`, settings.listId]);
  await saveDailySettings({ ...settings, date: today });
}
