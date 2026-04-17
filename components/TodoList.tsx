import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase/client';
import type { Todo, List } from '../lib/types';
import TodoItem from './TodoItem';
import AddEditModal from './AddEditModal';
import ToolbarOptionsMenu from './ToolbarOptionsMenu';
import ItemOptionsMenu from './ItemOptionsMenu';
import {
  IconLogo,
  IconSettings,
  IconHelp,
  IconOptions,
  IconAddBottom,
  IconAddTop,
  IconExpandDown,
  IconExpandUp,
} from './Icons';

function buildTree(todos: Todo[]): Todo[] {
  const map = new Map<number, Todo>();
  const roots: Todo[] = [];
  todos.forEach(t => map.set(t.id, { ...t, children: [] }));
  map.forEach(todo => {
    if (todo.parent_id === null) {
      roots.push(todo);
    } else {
      const parent = map.get(todo.parent_id);
      if (parent) parent.children!.push(todo);
    }
  });
  return roots;
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

export default function TodoList() {
  const insets = useSafeAreaInsets();

  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [showListPicker, setShowListPicker] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  // CRUD modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('New task');
  const [modalInitialTask, setModalInitialTask] = useState('');
  const [modalInitialNote, setModalInitialNote] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addParentId, setAddParentId] = useState<number | null>(null);

  // Menu state
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);
  const [itemMenuTodo, setItemMenuTodo] = useState<Todo | null>(null);
  const [itemMenuDepth, setItemMenuDepth] = useState(0);
  const [insertPosition, setInsertPosition] = useState<'top' | 'bottom'>('bottom');

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
    const validId = savedId && loadedLists.find(l => l.id === savedId)
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

  async function switchToList(id: number) {
    setActiveListId(id);
    await AsyncStorage.setItem('turbotodo-active-list', String(id));
    setShowListPicker(false);
    setTodos([]);
  }

  function saveCollapsedIds(ids: Set<number>) {
    if (activeListId === null) return;
    AsyncStorage.setItem(`turbotodo-collapsed-${activeListId}`, JSON.stringify([...ids]));
  }

  function toggleCollapse(id: number) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCollapsedIds(next);
      return next;
    });
  }

  async function toggleComplete(id: number, current: boolean) {
    await supabase.from('todos').update({ is_complete: !current }).eq('id', id);
    if (activeListId !== null) fetchTodos(activeListId, false);
  }

  // --- CRUD ---

  async function getSortOrderForInsert(parentId: number | null, position: 'top' | 'bottom'): Promise<number> {
    let query = supabase
      .from('todos')
      .select('sort_order')
      .eq('list_id', activeListId!);
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }
    const { data } = await query;
    if (!data || data.length === 0) return 0;
    const orders = data.map((r: { sort_order: number }) => r.sort_order);
    return position === 'top'
      ? Math.min(...orders) - 1
      : Math.max(...orders) + 1;
  }

  async function addTask(task: string, note: string) {
    if (!activeListId || !userId) return;
    const sort_order = await getSortOrderForInsert(addParentId, insertPosition);
    await supabase.from('todos').insert({
      user_id: userId,
      list_id: activeListId,
      parent_id: addParentId,
      task,
      note: note || null,
      is_complete: false,
      sort_order,
    });
    fetchTodos(activeListId, false);
  }

  async function updateTask(id: number, task: string, note: string) {
    await supabase.from('todos').update({ task, note: note || null }).eq('id', id);
    if (activeListId !== null) fetchTodos(activeListId, false);
  }

  async function deleteTask(id: number) {
    await supabase.from('todos').delete().eq('id', id);
    if (activeListId !== null) fetchTodos(activeListId, false);
  }

  async function setStatus(id: number, status: string | null) {
    await supabase.from('todos').update({ status }).eq('id', id);
    if (activeListId !== null) fetchTodos(activeListId, false);
  }

  // --- Modal helpers ---

  function openAdd(parentId: number | null, position: 'top' | 'bottom' = 'bottom') {
    setEditingId(null);
    setAddParentId(parentId);
    setInsertPosition(position);
    setModalTitle(parentId === null ? 'New task' : 'New subtask');
    setModalInitialTask('');
    setModalInitialNote('');
    setModalVisible(true);
  }

  function openEdit(todo: Todo) {
    setEditingId(todo.id);
    setAddParentId(null);
    setModalTitle('Edit task');
    setModalInitialTask(todo.task);
    setModalInitialNote(todo.note ?? '');
    setModalVisible(true);
  }

  function handleModalSave(task: string, note: string) {
    setModalVisible(false);
    if (editingId !== null) {
      updateTask(editingId, task, note);
    } else {
      addTask(task, note);
    }
  }

  // --- Menu handlers ---

  function handleLongPress(todo: Todo, depth: number) {
    setItemMenuTodo(todo);
    setItemMenuDepth(depth);
  }

  function handleItemDelete() {
    if (!itemMenuTodo) return;
    Alert.alert(
      'Delete task?',
      `"${itemMenuTodo.task}" and any subtasks will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(itemMenuTodo.id) },
      ],
      { cancelable: true }
    );
  }

  async function handleClearCompleted() {
    if (!activeListId) return;
    const flat = flattenTodos(todos);
    const completedIds = flat.filter(t => t.is_complete).map(t => t.id);
    if (completedIds.length === 0) return;
    await supabase.from('todos').delete().in('id', completedIds);
    fetchTodos(activeListId, false);
  }

  async function handleClearAll() {
    if (!activeListId) return;
    await supabase.from('todos').delete().eq('list_id', activeListId);
    fetchTodos(activeListId, false);
  }

  function flattenTodos(nodes: Todo[]): Todo[] {
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

  // --- Render ---

  const activeList = lists.find(l => l.id === activeListId) ?? null;
  const incomplete = todos.filter(t => !t.is_complete);
  const complete = todos.filter(t => t.is_complete);
  const allExpanded = collapsedIds.size === 0;

  function toggleAll() {
    if (allExpanded) {
      const next = new Set(getAllParentIds(todos));
      setCollapsedIds(next);
      saveCollapsedIds(next);
    } else {
      const next = new Set<number>();
      setCollapsedIds(next);
      saveCollapsedIds(next);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Logo — left:8, top:10, 42×42 */}
        <TouchableOpacity style={styles.logoBtn}>
          <IconLogo size={42} color="#025f96" />
        </TouchableOpacity>

        {/* List selector — left:60, top:15, 189×34 */}
        <TouchableOpacity
          style={styles.listSelector}
          onPress={() => setShowListPicker(true)}
        >
          <Text style={styles.listSelectorText} numberOfLines={1}>
            {activeList?.name ?? '…'}
          </Text>
          <Text style={styles.listSelectorArrow}>▼</Text>
        </TouchableOpacity>

        {/* List gear — left:260, top:20, 24×24 */}
        <TouchableOpacity style={styles.gearBtn}>
          <IconSettings size={24} color="#025f96" />
        </TouchableOpacity>

        {/* Help — right:21, top:20, 24×24 */}
        <TouchableOpacity style={styles.helpBtn}>
          <IconHelp size={24} color="#025f96" />
        </TouchableOpacity>
      </View>

      {/* List picker modal */}
      <Modal visible={showListPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowListPicker(false)}
        >
          <View style={styles.listPickerDropdown}>
            {lists.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.listPickerItem, l.id === activeListId && styles.listPickerItemActive]}
                onPress={() => switchToList(l.id)}
              >
                <Text style={[styles.listPickerText, l.id === activeListId && styles.listPickerTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add/edit modal */}
      <AddEditModal
        visible={modalVisible}
        title={modalTitle}
        initialTask={modalInitialTask}
        initialNote={modalInitialNote}
        onClose={() => setModalVisible(false)}
        onSave={handleModalSave}
      />

      {/* Toolbar options menu */}
      <ToolbarOptionsMenu
        visible={showToolbarMenu}
        onClose={() => setShowToolbarMenu(false)}
        onSync={() => activeListId && fetchTodos(activeListId, false)}
        onSort={criterion => {
          if (!activeListId) return;
          const incomplete = todos.filter(t => !t.is_complete);
          const complete = todos.filter(t => t.is_complete);
          const sorted = [...incomplete];
          if (criterion === 'status') {
            const rank = (s?: string | null) => s === 'top-priority' ? 0 : s === 'elevated' ? 1 : 2;
            sorted.sort((a, b) => rank(a.status) - rank(b.status));
          } else if (criterion === 'date') {
            sorted.sort((a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime());
          } else {
            sorted.sort((a, b) => a.task.localeCompare(b.task, undefined, { sensitivity: 'base' }));
          }
          setTodos([...sorted, ...complete]);
          Promise.all(sorted.map((t, idx) =>
            supabase.from('todos').update({ sort_order: idx * 10 }).eq('id', t.id)
          ));
        }}
        onClearCompleted={handleClearCompleted}
        onClearAll={handleClearAll}
        onSignOut={() => supabase.auth.signOut()}
      />

      {/* Item options menu */}
      <ItemOptionsMenu
        visible={itemMenuTodo !== null}
        todo={itemMenuTodo}
        depth={itemMenuDepth}
        onClose={() => setItemMenuTodo(null)}
        onEdit={() => { if (itemMenuTodo) openEdit(itemMenuTodo); }}
        onAddSubtask={() => { if (itemMenuTodo) openAdd(itemMenuTodo.id); }}
        onDelete={handleItemDelete}
        onSetStatus={(status) => { if (itemMenuTodo) setStatus(itemMenuTodo.id, status); }}
      />

      {/* ── Todo list ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#025f96" />
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            {incomplete.length === 0 && (
              <Text style={styles.emptyState}>No tasks yet.</Text>
            )}
            {incomplete.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                depth={0}
                collapsedIds={collapsedIds}
                onToggleCollapse={toggleCollapse}
                onToggleComplete={toggleComplete}
                onLongPress={handleLongPress}
                onAddSubtask={id => openAdd(id)}
              />
            ))}
          </View>

          {complete.length > 0 && (
            <View style={[styles.section, styles.sectionDone]}>
              <Text style={styles.sectionLabel}>Completed</Text>
              {complete.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  depth={0}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={toggleCollapse}
                  onToggleComplete={toggleComplete}
                  onLongPress={handleLongPress}
                  onAddSubtask={id => openAdd(id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Bottom toolbar ── */}
      <View style={[styles.toolbarOuter, { paddingBottom: insets.bottom }]}>
        <View style={styles.toolbarInner}>
          {/* Kebab — left:24, vertically centered */}
          <TouchableOpacity style={styles.toolbarLeft} onPress={() => setShowToolbarMenu(true)}>
            <IconOptions size={24} color="#025f96" />
          </TouchableOpacity>

          {/* Create-new group — centered */}
          <View style={styles.toolbarCenter}>
            <TouchableOpacity
              style={styles.toolbarIconBtn}
              onPress={() => openAdd(null, 'bottom')}
            >
              <IconAddBottom size={18} color="#025f96" />
            </TouchableOpacity>
            <Text style={styles.newLabel}>new</Text>
            <TouchableOpacity
              style={styles.toolbarIconBtn}
              onPress={() => openAdd(null, 'top')}
            >
              <IconAddTop size={18} color="#025f96" />
            </TouchableOpacity>
          </View>

          {/* Expand/collapse — right:22, vertically centered */}
          <TouchableOpacity style={styles.toolbarRight} onPress={toggleAll}>
            {allExpanded
              ? <IconExpandUp size={24} color="#025f96" />
              : <IconExpandDown size={24} color="#025f96" />
            }
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const ICON_COLOR = '#025f96';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003759',
  },

  // ── Header ──
  header: {
    height: 64,
    backgroundColor: '#F6CD75',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 21,
  },
  logoBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSelector: {
    width: 189,
    height: 34,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe8a9',
    borderBottomWidth: 1,
    borderBottomColor: '#023455',
    borderRadius: 3,
    paddingHorizontal: 10,
    gap: 6,
  },
  listSelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#00395b',
  },
  listSelectorArrow: {
    fontSize: 10,
    color: '#00395b',
  },
  gearBtn: {
    width: 24,
    height: 24,
    marginLeft: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtn: {
    width: 24,
    height: 24,
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── List picker ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: 12,
  },
  listPickerDropdown: {
    backgroundColor: '#ffe8a9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c7ba9b',
    overflow: 'hidden',
  },
  listPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d0a0',
  },
  listPickerItemActive: {
    backgroundColor: '#E2D4AD',
  },
  listPickerText: {
    fontSize: 15,
    color: '#00395b',
  },
  listPickerTextActive: {
    fontWeight: '600',
  },

  // ── Scroll area ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#e6dac8',
    margin: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c7ba9b',
  },
  sectionDone: {
    opacity: 0.75,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6a3f1f',
    paddingHorizontal: 12,
    paddingTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 24,
  },

  // ── Toolbar ──
  toolbarOuter: {
    backgroundColor: '#F6CD75',
    borderTopWidth: 1,
    borderTopColor: '#e0c060',
  },
  toolbarInner: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarLeft: {
    width: 56,
    height: 42,
    paddingLeft: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  toolbarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolbarIconBtn: {
    padding: 4,
  },
  newLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ICON_COLOR,
    letterSpacing: 0.5,
  },
  toolbarRight: {
    width: 58,
    height: 42,
    paddingRight: 22,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
