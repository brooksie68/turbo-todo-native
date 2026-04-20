import db from './db';

export type TaskLink = {
  id: number;
  todo_id: number;
  url: string;
  name?: string | null;
  sort_order: number;
};

export async function getLinks(todoId: number): Promise<TaskLink[]> {
  return db.getAllAsync<TaskLink>(
    'SELECT * FROM task_links WHERE todo_id = ? ORDER BY sort_order',
    [todoId],
  );
}

export async function getAllLinks(todoIds: number[]): Promise<Record<number, TaskLink[]>> {
  if (todoIds.length === 0) return {};
  const placeholders = todoIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<TaskLink>(
    `SELECT * FROM task_links WHERE todo_id IN (${placeholders}) ORDER BY sort_order`,
    todoIds,
  );
  const result: Record<number, TaskLink[]> = {};
  todoIds.forEach(id => { result[id] = []; });
  rows.forEach(link => {
    if (!result[link.todo_id]) result[link.todo_id] = [];
    result[link.todo_id].push(link);
  });
  return result;
}

export async function addLink(
  todoId: number,
  url: string,
  name: string | null,
  sortOrder: number,
): Promise<TaskLink | null> {
  const result = await db.runAsync(
    'INSERT INTO task_links (todo_id, url, name, sort_order) VALUES (?, ?, ?, ?)',
    [todoId, url, name, sortOrder],
  );
  return { id: result.lastInsertRowId, todo_id: todoId, url, name, sort_order: sortOrder };
}

export async function deleteLink(id: number): Promise<void> {
  await db.runAsync('DELETE FROM task_links WHERE id = ?', [id]);
}

export async function deleteLinksForTodo(todoId: number): Promise<void> {
  await db.runAsync('DELETE FROM task_links WHERE todo_id = ?', [todoId]);
}
