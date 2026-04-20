import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';
import db from '../lib/db';
import type { Todo, List } from '../lib/types';
import { deleteImagesForTodo, getAllImages, type TaskImage } from '../lib/imageStore';
import { getAllLinks, type TaskLink } from '../lib/linkStore';

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

// Optimistic tree helpers
function updateTodoInTree(todos: Todo[], id: number, updates: Partial<Todo>): Todo[] {
  return todos.map(todo => {
    if (todo.id === id) return { ...todo, ...updates };
    if (todo.children?.length) return { ...todo, children: updateTodoInTree(todo.children, id, updates) };
    return todo;
  });
}

function removeTodoFromTree(todos: Todo[], id: number): Todo[] {
  return todos
    .filter(t => t.id !== id)
    .map(t => ({ ...t, children: t.children ? removeTodoFromTree(t.children, id) : [] }));
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
  const [dragExpandedId, setDragExpandedId] = useState<number | null>(null);
  const [imageMap, setImageMap] = useState<Record<number, TaskImage[]>>({});
  const [linkMap, setLinkMap] = useState<Record<number, TaskLink[]>>({});
  const rawTodosRef = useRef<Todo[]>([]);

  // CRUD modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('New task');
  const [modalInitialTask, setModalInitialTask] = useState('');
  const [modalInitialNote, setModalInitialNote] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [insertPosition, setInsertPosition] = useState<'top' | 'bottom'>('bottom');

  // ── Media maps ───────────────────────────────────────────────────────────

  const loadAllMedia = useCallback(async (rawTodos: Todo[]) => {
    const rootIds = new Set(rawTodos.filter(t => t.parent_id === null).map(t => t.id));
    const depth1Ids = rawTodos
      .filter(t => t.parent_id !== null && rootIds.has(t.parent_id))
      .map(t => t.id);
    if (depth1Ids.length === 0) {
      setImageMap({});
      setLinkMap({});
      return;
    }
    const [images, links] = await Promise.all([
      getAllImages(depth1Ids),
      getAllLinks(depth1Ids),
    ]);
    setImageMap(images);
    setLinkMap(links);
  }, []);

  const refreshMedia = useCallback(async () => {
    await loadAllMedia(rawTodosRef.current);
  }, [loadAllMedia]);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchTodos = useCallback(async (listId: number, showLoading = true) => {
    if (showLoading) setLoading(true);
    const rows = await db.getAllAsync<Todo>(
      'SELECT * FROM todos WHERE list_id = ? ORDER BY sort_order, inserted_at',
      [listId],
    );
    // SQLite returns booleans as 0/1 integers — cast them
    const data = rows.map(t => ({ ...t, is_complete: !!t.is_complete, pinned: !!t.pinned }));
    rawTodosRef.current = data;
    setTodos(buildTree(data));
    loadAllMedia(data);
    if (showLoading) setLoading(false);
  }, [loadAllMedia]);

  const fetchLists = useCallback(async () => {
    let loadedLists = await db.getAllAsync<List>(
      'SELECT * FROM lists ORDER BY sort_order, inserted_at',
      [],
    );

    if (loadedLists.length === 0) {
      const result = await db.runAsync(
        'INSERT INTO lists (name, sort_order) VALUES (?, ?)',
        ['My ToDo List', 0],
      );
      loadedLists = [{
        id: result.lastInsertRowId,
        name: 'My ToDo List',
        sort_order: 0,
        inserted_at: new Date().toISOString(),
      }];
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

  const toggleComplete = useCallback((id: number, current: boolean) => {
    const newValue = !current;
    setTodos(prev => updateTodoInTree(prev, id, { is_complete: newValue }));
    db.runAsync('UPDATE todos SET is_complete = ? WHERE id = ?', [newValue ? 1 : 0, id]);
  }, []);

  async function getSortOrderForInsert(
    parentId: number | null,
    position: 'top' | 'bottom',
    listId: number,
  ): Promise<number> {
    const rows = await db.getAllAsync<{ sort_order: number }>(
      parentId === null
        ? 'SELECT sort_order FROM todos WHERE list_id = ? AND parent_id IS NULL'
        : 'SELECT sort_order FROM todos WHERE parent_id = ?',
      parentId === null ? [listId] : [parentId],
    );
    if (rows.length === 0) return 0;
    const orders = rows.map(r => r.sort_order);
    return position === 'top' ? Math.min(...orders) - 1 : Math.max(...orders) + 1;
  }

  const addTask = useCallback(async (
    task: string,
    note: string,
    parentId: number | null,
    position: 'top' | 'bottom',
    listId: number,
  ) => {
    const sort_order = await getSortOrderForInsert(parentId, position, listId);
    await db.runAsync(
      'INSERT INTO todos (list_id, parent_id, task, note, is_complete, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
      [listId, parentId, task, note || null, sort_order],
    );
    fetchTodos(listId, false);
  }, [fetchTodos]);

  const updateTask = useCallback((id: number, task: string, note: string, _listId: number) => {
    setTodos(prev => updateTodoInTree(prev, id, { task, note: note || null }));
    db.runAsync('UPDATE todos SET task = ?, note = ? WHERE id = ?', [task, note || null, id]);
  }, []);

  const deleteTask = useCallback(async (id: number, currentTodos: Todo[], _listId: number) => {
    const subtreeIds = getSubtreeIds(id, currentTodos);
    setTodos(prev => removeTodoFromTree(prev, id));
    await Promise.all(subtreeIds.map(tid => deleteImagesForTodo(tid)));
    // CASCADE in schema handles deleting subtree rows
    db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
  }, []);

  const setStatus = useCallback((id: number, status: string | null, _listId: number) => {
    setTodos(prev => updateTodoInTree(prev, id, { status }));
    db.runAsync('UPDATE todos SET status = ? WHERE id = ?', [status, id]);
  }, []);

  const setPinned = useCallback((id: number, pinned: boolean) => {
    setTodos(prev => updateTodoInTree(prev, id, { pinned }));
    db.runAsync('UPDATE todos SET pinned = ? WHERE id = ?', [pinned ? 1 : 0, id]);
  }, []);

  const handleClearCompleted = useCallback(async (currentTodos: Todo[], _listId: number) => {
    const flat = flattenAll(currentTodos);
    const completedIds = flat.filter(t => t.is_complete).map(t => t.id);
    if (completedIds.length === 0) return;
    setTodos(prev => prev.filter(t => !t.is_complete));
    await Promise.all(completedIds.map(id => deleteImagesForTodo(id)));
    const placeholders = completedIds.map(() => '?').join(',');
    db.runAsync(`DELETE FROM todos WHERE id IN (${placeholders})`, completedIds);
  }, []);

  const handleClearAll = useCallback(async (currentTodos: Todo[], listId: number) => {
    const flat = flattenAll(currentTodos);
    const allIds = flat.map(t => t.id);
    setTodos([]);
    await Promise.all(allIds.map(id => deleteImagesForTodo(id)));
    db.runAsync('DELETE FROM todos WHERE list_id = ?', [listId]);
  }, []);

  const handleSort = useCallback((criterion: string, _listId: number) => {
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
      sorted.forEach((t, idx) => {
        db.runAsync('UPDATE todos SET sort_order = ? WHERE id = ?', [idx * 10, t.id]);
      });
      return [...sorted, ...complete];
    });
  }, []);

  const saveNote = useCallback(async (id: number, note: string | null, _listId: number) => {
    setTodos(prev => updateTodoInTree(prev, id, { note }));
    db.runAsync('UPDATE todos SET note = ? WHERE id = ?', [note, id]);
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

  const handleDragBeginById = useCallback((id: number, incompleteFlat: FlatItem[]) => {
    Vibration.vibrate(40);
    const item = incompleteFlat.find(fi => fi.todo.id === id);
    if (item && item.todo.children && item.todo.children.length > 0 && !collapsedIds.has(id)) {
      setDragExpandedId(id);
      setCollapsedIds(prev => { const next = new Set(prev); next.add(id); return next; });
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
    // Prevent dropping above a pinned item at depth 0
    if (draggedItem.depth === 0) {
      const pinnedCount = newFlat.filter(fi => fi.depth === 0 && fi.todo.pinned).length;
      if (to < pinnedCount) return;
    }
    const siblings = newFlat.filter(fi => fi.parentId === draggedItem.parentId);
    await Promise.all(
      siblings.map((fi, idx) =>
        db.runAsync('UPDATE todos SET sort_order = ? WHERE id = ?', [idx * 10, fi.todo.id]),
      ),
    );
    fetchTodos(listId, false);
  }, [dragExpandedId, fetchTodos]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const activeList = useMemo(() => lists.find(l => l.id === activeListId) ?? null, [lists, activeListId]);
  const incomplete = useMemo(
    () => [...todos.filter(t => !t.is_complete)].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    }),
    [todos],
  );
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
    lists, activeListId, todos, loading, collapsedIds,
    // derived
    activeList, incomplete, complete, incompleteFlat, completeFlat, allExpanded,
    // list management
    fetchTodos, fetchLists, switchToList,
    // collapse
    toggleCollapse, toggleAll,
    // CRUD
    toggleComplete, addTask, updateTask, deleteTask, setStatus, setPinned,
    handleClearCompleted, handleClearAll, handleSort, saveNote,
    // CRUD modal
    modalVisible, setModalVisible,
    modalTitle, modalInitialTask, modalInitialNote, editingId, addParentId, insertPosition,
    openAdd, openEdit,
    // drag
    handleDragBegin, handleDragBeginById, handleDragEnd,
    // media maps
    imageMap, linkMap, refreshMedia,
  };
}

export type TodoData = ReturnType<typeof useTodoData>;
