import { supabase } from './supabase/client';

export type TaskLink = {
  id: number;
  todo_id: number;
  url: string;
  name?: string | null;
  sort_order: number;
};

export async function getLinks(todoId: number): Promise<TaskLink[]> {
  const { data } = await supabase
    .from('task_links')
    .select('*')
    .eq('todo_id', todoId)
    .order('sort_order', { ascending: true });
  return (data as TaskLink[]) ?? [];
}

export async function addLink(
  userId: string,
  todoId: number,
  url: string,
  name: string | null,
  sortOrder: number
): Promise<TaskLink | null> {
  const { data } = await supabase
    .from('task_links')
    .insert({ user_id: userId, todo_id: todoId, url, name: name || null, sort_order: sortOrder })
    .select()
    .single();
  return data as TaskLink | null;
}

export async function deleteLink(id: number): Promise<void> {
  await supabase.from('task_links').delete().eq('id', id);
}

export async function deleteLinksForTodo(todoId: number): Promise<void> {
  await supabase.from('task_links').delete().eq('todo_id', todoId);
}
