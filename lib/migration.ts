import AsyncStorage from '@react-native-async-storage/async-storage';
import db from './db';

const MIGRATION_KEY = 'supabase_migration_done';

export async function isMigrationDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(MIGRATION_KEY);
  return val === 'true';
}

export async function runMigration(data: {
  lists: Array<{ id: number; name: string; sort_order: number; inserted_at: string }>;
  todos: Array<{
    id: number;
    task: string;
    is_complete: boolean;
    parent_id: number | null;
    list_id: number;
    sort_order: number;
    inserted_at: string;
    note: string | null;
    status: string | null;
  }>;
  links: Array<{
    id: number;
    todo_id: number;
    url: string;
    name: string | null;
    sort_order: number;
  }>;
}): Promise<void> {
  // Wipe existing data first so we don't double-insert on retry
  db.execSync('DELETE FROM task_links; DELETE FROM todos; DELETE FROM lists;');

  for (const list of data.lists) {
    db.runSync(
      'INSERT INTO lists (id, name, sort_order, inserted_at) VALUES (?, ?, ?, ?)',
      [list.id, list.name, list.sort_order, list.inserted_at],
    );
  }

  for (const todo of data.todos) {
    db.runSync(
      `INSERT INTO todos
         (id, list_id, parent_id, task, note, is_complete, sort_order, inserted_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        todo.id,
        todo.list_id,
        todo.parent_id,
        todo.task,
        todo.note,
        todo.is_complete ? 1 : 0,
        todo.sort_order,
        todo.inserted_at,
        todo.status,
      ],
    );
  }

  for (const link of data.links) {
    db.runSync(
      'INSERT INTO task_links (id, todo_id, url, name, sort_order) VALUES (?, ?, ?, ?, ?)',
      [link.id, link.todo_id, link.url, link.name, link.sort_order],
    );
  }

  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}
