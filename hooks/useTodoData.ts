import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';
import { supabase } from '../lib/supabase/client';
import type { Todo, List } from '../lib/types';
import { deleteImagesForTodo } from '../lib/imageStore';

// ── Tree helpers ────────────────────────────────────────────────────────────

export function buildTree(todos: Todo[]): Todo[] {
  const map = new Map<number, Todo>();
  const roots: Todo[] = [];
  todos.forEach(t => map.set(t.id, { ...t, children: [] }));
  map.forEach(todo => {
    if (todo.parent_id === null) roots.push(todo);
    else map.get(todo.parent_id)?.children!.push(todo);
  });
  return roots;
}

export type FlatItem = { todo: Todo; depth: number; parentId: number | null };

export function flattenVisible(
  nodes: Todo[],
  collapsedIds: Set<number>,
  depth = 0,
  parentId: number | null = null,
): FlatItem[] {
  const result: FlatItem[] = [];
  for (const node of nodes) {
    result.push({ todo: node, depth, parentId });
    if (node.children && node.children.length > 0 && !collapsedIds.has(node.id)) {
      const sorted = [...node.children].sort((a, b) =>
        a.is_complete !== b.is_complete ? (a.is_complete ? 1 : -1) : 0,
      );
      result.push(...flattenVisible(sorted, collapsedIds, depth + 1, node.id));
    }
  }
  return result;
}

function getAllParentIds(todos: Todo[]): number[] {
  const ids: number[] = [];
  function walk(nodes: Todo[]) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  }
  walk(todos);
  return ids;
}

export function flattenAll(nodes: Todo[]): Todo[] {
  const result: Todo[] = [];
  function walk(items: Todo[]) {
    for (const item of items) {
      result.push(item);
      if (item.children) walk(item.children);
    }
  }
  walk(nodes);
  return result;
}

function getSubtreeIds(id: number, nodes: Todo[]): number[] {
  function findNode(ns: Todo[]): Todo | null {
    for (const n of ns) {
      if (n.id === id) return n;
      const found = findNode(n.children ?? []);
      if (found) return found;
    }
    return null;
  }
  const node = findNode(nodes);
  if (!node) return [id];
  const ids: number[] = [];
  function collect(n: Todo) {
    ids.push(n.id);
    for (const c of n.children ?? []) collect(c);
  }
  collect(node);
  return ids;
}

export function formatItemTree(node: Todo, d: number): string {
  const indent = '  '.repeat(d);
  const label = d === 0 ? `- **${node.task}**` : `${indent}- ${node.task}`;
  const incompleteChildren = (node.children ?? []).filter(c => !c.is_complete);
  const childLines = incompleteChildren.map(c => formatItemTree(c, d + 1)).join('\n');
  return childLines ? `${label}\n${childLines}` : label;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useTodoData() {
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [dragExpandedId, setDragExpandedId] = useState<number | null>(null);

  // CRUD modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('New task');
  const [modalInitialTask, setModalInitialTask] = useState('');
  const [modalInitialNote, setModalInitialNote] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [insertPosition, setInsertPosition] = useState<'top' | 'bottom'>('bottom');

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchTodos = useCallback(async (listId: number, showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('list_id', listId)
      .order('sort_order', { ascending: true })
      .order('inserted_at', { ascending: true });
    if (data) setTodos(buildTree(data as Todo[]));
    if (showLoading) setLoading(false);
  }, []);

  const fetchLists = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from('lists')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('inserted_at', { ascending: true });

    let loadedLists = (data as List[]) || [];

    if (loadedLists.length === 0) {
      const { data: newList } = await supabase
        .from('lists')
        .insert({ user_id: user.id, name: 'My ToDo List', sort_order: 0 })
        .select()
        .single();
      if (newList) loadedLists = [newList as List];
    }

    setLists(loadedLists);

    const saved = await AsyncStorage.getItem('turbotodo-active-list');
    const savedId = saved ? parseInt(saved, 10) : null;
    const validId =
      savedId && loadedLists.find(l => l.id === savedId)
        ? savedId
        : loadedLists[0]?.id ?? null;
    setActiveListId(validId);
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  useEffect(() => {
    if (activeListId !== null) fetchTodos(activeListId);
  }, [activeListId, fetchTodos]);

  useEffect(() => {
    if (activeListId === null) return;
    AsyncStorage.getItem(`turbotodo-collapsed-${activeListId}`).then(saved => {
      if (saved) {
        try { setCollapsedIds(new Set(JSON.parse(saved) as number[])); }
        catch { setCollapsedIds(new Set()); }
      } else {
        setCollapsedIds(new Set());
      }
    });
  }, [activeListId]);

  // ── List management ──────────────────────────────────────────────────────

  const switchToList = useCallback(async (id: number) => {
    setActiveListId(id);
    await AsyncStorage.setItem('turbotodo-active-list', String(id));
    setTodos([]);
  }, []);

  const saveCollapsedIds = useCallback((ids: Set<number>, listId: number | null) => {
    if (listId === null) return;
    AsyncStorage.setItem(`turbotodo-collapsed-${listId}`, JSON.stringify([...ids]));
  }, []);

  // ── Collapse ─────────────────────────────────────────────────────────────

  const toggleCollapse = useCallback((id: number) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Persist collapse changes — separate effect to avoid stale activeListId closure
  useEffect(() => {
    saveCollapsedIds(collapsedIds, activeListId);
  }, [collapsedIds, activeListId, saveCollapsedIds]);

  const toggleAll = useCallback((allExpanded: boolean) => {
    setTodos(prev => {
      if (allExpanded) {
        setCollapsedIds(new Set(getAllParentIds(prev)));
      } else {
        setCollapsedIds(new Set());
      }
      return prev;
    });
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const toggleComplete = useCallback(async (id: number, current: boolean) => {
    await supabase.from('todos').update({ is_complete: !current }).eq('id', id);
    setActiveListId(prev => { if (prev !== null) fetchTodos(prev, false); return prev; });
  }, [fetchTodos]);

  async function getSortOrderForInsert(parentId: number | null, position: 'top' | 'bottom', listId: number): Promise<number> {
    let query = supabase.from('todos').select('sort_order').eq('list_id', listId);
    if (parentId === null) query = query.is('parent_id', null);
    else query = query.eq('parent_id', parentId);
    const { data } = await query;
    if (!data || data.length === 0) return 0;
    const orders = data.map((r: { sort_order: number }) => r.sort_order);
    return position === 'top' ? Math.min(...orders) - 1 : Math.max(...orders) + 1;
  }

  const addTask = useCallback(async (task: string, note: string, parentId: number | null, position: 'top' | 'bottom', listId: number, uid: string) => {
    const sort_order = await getSortOrderForInsert(parentId, position, listId);
    await supabase.from('todos').insert({
      user_id: uid,
      list_id: listId,
      parent_id: parentId,
      task,
      note: note || null,
      is_complete: false,
      sort_order,
    });
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const updateTask = useCallback(async (id: number, task: string, note: string, listId: number) => {
    await supabase.from('todos').update({ task, note: note || null }).eq('id', id);
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const deleteTask = useCallback(async (id: number, currentTodos: Todo[], listId: number) => {
    const subtreeIds = getSubtreeIds(id, currentTodos);
    await supabase.from('todos').delete().eq('id', id);
    await Promise.all(subtreeIds.map(tid => deleteImagesForTodo(tid)));
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const setStatus = useCallback(async (id: number, status: string | null, listId: number) => {
    await supabase.from('todos').update({ status }).eq('id', id);
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const handleClearCompleted = useCallback(async (currentTodos: Todo[], listId: number) => {
    const flat = flattenAll(currentTodos);
    const completedIds = flat.filter(t => t.is_complete).map(t => t.id);
    if (completedIds.length === 0) return;
    await supabase.from('todos').delete().in('id', completedIds);
    await Promise.all(completedIds.map(id => deleteImagesForTodo(id)));
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const handleClearAll = useCallback(async (currentTodos: Todo[], listId: number) => {
    const flat = flattenAll(currentTodos);
    const allIds = flat.map(t => t.id);
    await supabase.from('todos').delete().eq('list_id', listId);
    await Promise.all(allIds.map(id => deleteImagesForTodo(id)));
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const handleSort = useCallback((criterion: string, listId: number) => {
    setTodos(prev => {
      const incomplete = prev.filter(t => !t.is_complete);
      const complete = prev.filter(t => t.is_complete);
      const sorted = [...incomplete];
      if (criterion === 'status') {
        const rank = (s?: string | null) => s === 'top-priority' ? 0 : s === 'elevated' ? 1 : 2;
        sorted.sort((a, b) => rank(a.status) - rank(b.status));
      } else if (criterion === 'date') {
        sorted.sort((a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime());
      } else {
        sorted.sort((a, b) => a.task.localeCompare(b.task, undefined, { sensitivity: 'base' }));
      }
      Promise.all(sorted.map((t, idx) =>
        supabase.from('todos').update({ sort_order: idx * 10 }).eq('id', t.id),
      ));
      return [...sorted, ...complete];
    });
  }, []);

  // ── CRUD modal helpers ───────────────────────────────────────────────────

  const openAdd = useCallback((parentId: number | null, position: 'top' | 'bottom' = 'bottom') => {
    setEditingId(null);
    setAddParentId(parentId);
    setInsertPosition(position);
    setModalTitle(parentId === null ? 'New task' : 'New subtask');
    setModalInitialTask('');
    setModalInitialNote('');
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setAddParentId(null);
    setModalTitle('Edit task');
    setModalInitialTask(todo.task);
    setModalInitialNote(todo.note ?? '');
    setModalVisible(true);
  }, []);

  // ── Drag and drop ────────────────────────────────────────────────────────

  const handleDragBegin = useCallback((index: number, incompleteFlat: FlatItem[]) => {
    const item = incompleteFlat[index];
    if (!item) return;
    Vibration.vibrate(40);
    if (item.todo.children && item.todo.children.length > 0 && !collapsedIds.has(item.todo.id)) {
      setDragExpandedId(item.todo.id);
      setCollapsedIds(prev => { const next = new Set(prev); next.add(item.todo.id); return next; });
    }
  }, [collapsedIds]);

  const handleDragEnd = useCallback(async (
    newFlat: FlatItem[],
    from: number,
    to: number,
    listId: number,
  ) => {
    if (dragExpandedId !== null) {
      const expandId = dragExpandedId;
      setDragExpandedId(null);
      setCollapsedIds(prev => { const next = new Set(prev); next.delete(expandId); return next; });
    }
    if (from === to) return;
    Vibration.vibrate(25);
    const draggedItem = newFlat[to];
    if (!draggedItem) return;
    const siblings = newFlat.filter(fi => fi.parentId === draggedItem.parentId);
    await Promise.all(
      siblings.map((fi, idx) =>
        supabase.from('todos').update({ sort_order: idx * 10 }).eq('id', fi.todo.id),
      ),
    );
    fetchTodos(listId, false);
  }, [dragExpandedId, fetchTodos]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const activeList = useMemo(() => lists.find(l => l.id === activeListId) ?? null, [lists, activeListId]);
  const incomplete = useMemo(() => todos.filter(t => !t.is_complete), [todos]);
  const complete = useMemo(() => todos.filter(t => t.is_complete), [todos]);
  const allExpanded = collapsedIds.size === 0;

  const incompleteFlat = useMemo(
    () => flattenVisible(incomplete, collapsedIds),
    [incomplete, collapsedIds],
  );
  const completeFlat = useMemo(
    () => flattenVisible(complete, collapsedIds),
    [complete, collapsedIds],
  );

  return {
    // state
    lists, activeListId, todos, loading, userId, collapsedIds,
    // derived
    activeList, incomplete, complete, incompleteFlat, completeFlat, allExpanded,
    // list management
    fetchTodos, fetchLists, switchToList,
    // collapse
    toggleCollapse, toggleAll,
    // CRUD
    toggleComplete, addTask, updateTask, deleteTask, setStatus,
    handleClearCompleted, handleClearAll, handleSort,
    // CRUD modal
    modalVisible, setModalVisible,
    modalTitle, modalInitialTask, modalInitialNote, editingId, addParentId, insertPosition,
    openAdd, openEdit,
    // drag
    handleDragBegin, handleDragEnd,
  };
}

export type TodoData = ReturnType<typeof useTodoData>;
