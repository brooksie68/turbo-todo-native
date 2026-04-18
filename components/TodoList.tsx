import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
  StyleSheet,
  ToastAndroid,
  Vibration,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import type { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase/client';
import type { Todo, List } from '../lib/types';
import { addImages, getImages, MAX_IMAGES } from '../lib/imageStore';
import { addLink } from '../lib/linkStore';
import TodoItem from './TodoItem';
import AddEditModal from './AddEditModal';
import AddLinkModal from './AddLinkModal';
import ToolbarOptionsMenu from './ToolbarOptionsMenu';
import ItemOptionsMenu, { type ButtonLayout } from './ItemOptionsMenu';
import { useTheme, useThemeContext, themes } from '../lib/theme';
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

type FlatItem = {
  todo: Todo;
  depth: number;
  parentId: number | null;
};

function flattenVisible(
  nodes: Todo[],
  collapsedIds: Set<number>,
  depth = 0,
  parentId: number | null = null,
): FlatItem[] {
  const result: FlatItem[] = [];
  for (const node of nodes) {
    result.push({ todo: node, depth, parentId });
    if (node.children && node.children.length > 0 && !collapsedIds.has(node.id)) {
      const sorted = [...node.children].sort((a, b) => {
        if (a.is_complete !== b.is_complete) return a.is_complete ? 1 : -1;
        return 0;
      });
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

export default function TodoList() {
  const insets = useSafeAreaInsets();
  const { theme, themeId, setThemeId } = useThemeContext();

  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [showListPicker, setShowListPicker] = useState(false);
  const [themePickerLayout, setThemePickerLayout] = useState<{ top: number; left: number } | null>(null);
  const logoBtnRef = useRef<View>(null);
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
  const [itemMenuLayout, setItemMenuLayout] = useState<ButtonLayout | null>(null);
  const [insertPosition, setInsertPosition] = useState<'top' | 'bottom'>('bottom');

  // Note modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteEditingTodo, setNoteEditingTodo] = useState<Todo | null>(null);

  const [dragExpandedId, setDragExpandedId] = useState<number | null>(null);

  // Image / link state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetTodo, setLinkTargetTodo] = useState<Todo | null>(null);
  const [imageRefreshToken, setImageRefreshToken] = useState(0);
  const [linkRefreshToken, setLinkRefreshToken] = useState(0);
  const [itemMenuImageCount, setItemMenuImageCount] = useState(0);

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

  // --- Image / link handlers ---

  async function handleAddImage(todo: Todo) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add images.');
      return;
    }
    const existing = await getImages(todo.id);
    const slots = MAX_IMAGES - existing.length;
    if (slots <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: slots,
    });
    if (result.canceled) return;

    const uris = result.assets.map(a => a.uri);
    await addImages(todo.id, uris);
    setImageRefreshToken(t => t + 1);

    if (uris.length < result.assets.length) {
      ToastAndroid.show(`Only ${slots} slot${slots === 1 ? '' : 's'} remaining — added ${uris.length}`, ToastAndroid.SHORT);
    }
  }

  function handleAddUrl(todo: Todo) {
    setLinkTargetTodo(todo);
    setShowLinkModal(true);
  }

  async function handleSaveLink(url: string, name: string) {
    setShowLinkModal(false);
    if (!linkTargetTodo || !userId) return;
    const existing = await import('../lib/linkStore').then(m => m.getLinks(linkTargetTodo.id));
    const sort_order = existing.length;
    await addLink(userId, linkTargetTodo.id, url, name || null, sort_order);
    setLinkRefreshToken(t => t + 1);
    setLinkTargetTodo(null);
  }

  // --- Menu handlers ---

  async function handleOptions(todo: Todo, depth: number, layout: ButtonLayout) {
    const images = await getImages(todo.id);
    setItemMenuImageCount(images.length);
    setItemMenuTodo(todo);
    setItemMenuDepth(depth);
    setItemMenuLayout(layout);
  }

  function closeItemMenu() {
    setItemMenuTodo(null);
    setItemMenuLayout(null);
  }

  function handleEditNote() {
    if (!itemMenuTodo) return;
    setNoteEditingTodo(itemMenuTodo);
    setNoteModalVisible(true);
  }

  async function handleSaveNote(_task: string, note: string) {
    setNoteModalVisible(false);
    if (!noteEditingTodo || !activeListId) return;
    await supabase.from('todos').update({ note: note || null }).eq('id', noteEditingTodo.id);
    fetchTodos(activeListId, false);
    setNoteEditingTodo(null);
  }

  async function handleDeleteNote() {
    if (!itemMenuTodo || !activeListId) return;
    await supabase.from('todos').update({ note: null }).eq('id', itemMenuTodo.id);
    fetchTodos(activeListId, false);
  }

  function formatItemTree(node: Todo, d: number): string {
    const indent = '  '.repeat(d);
    const label = d === 0 ? `- **${node.task}**` : `${indent}- ${node.task}`;
    const incompleteChildren = (node.children ?? []).filter(c => !c.is_complete);
    const childLines = incompleteChildren.map(c => formatItemTree(c, d + 1)).join('\n');
    return childLines ? `${label}\n${childLines}` : label;
  }

  async function handleExportForAI() {
    if (!itemMenuTodo) return;
    const body = formatItemTree(itemMenuTodo, 0);
    const text = [
      `[TurboTodo Export — "${activeList?.name ?? ''}"]`,
      `Markdown outline. Top-level item is bold. Each subtask level is indented 2 spaces + dash.\n`,
      `---\n`,
      body,
      `\n---\n`,
      `Please acknowledge receipt of this list only. Do not analyze, summarize, or take any action unless specifically asked.`,
    ].join('\n');
    try {
      await Share.share({ message: text, title: 'TurboTodo Export' });
    } catch {}
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

  // --- Drag and drop ---

  function handleDragBegin(index: number) {
    const item = incompleteFlat[index];
    if (!item) return;
    Vibration.vibrate(40);
    if (item.todo.children && item.todo.children.length > 0 && !collapsedIds.has(item.todo.id)) {
      setDragExpandedId(item.todo.id);
      setCollapsedIds(prev => {
        const next = new Set(prev);
        next.add(item.todo.id);
        saveCollapsedIds(next);
        return next;
      });
    }
  }

  async function handleDragEnd({ data: newFlat, from, to }: { data: FlatItem[]; from: number; to: number }) {
    if (dragExpandedId !== null) {
      const expandId = dragExpandedId;
      setDragExpandedId(null);
      setCollapsedIds(prev => {
        const next = new Set(prev);
        next.delete(expandId);
        saveCollapsedIds(next);
        return next;
      });
    }
    if (from === to) return;
    Vibration.vibrate(25);
    const draggedItem = newFlat[to];
    if (!draggedItem) return;
    const siblings = newFlat.filter(fi => fi.parentId === draggedItem.parentId);
    await Promise.all(
      siblings.map((fi, idx) =>
        supabase.from('todos').update({ sort_order: idx * 10 }).eq('id', fi.todo.id)
      )
    );
    if (activeListId !== null) fetchTodos(activeListId, false);
  }

  // --- Render ---

  const activeList = lists.find(l => l.id === activeListId) ?? null;
  const incomplete = todos.filter(t => !t.is_complete);
  const complete = todos.filter(t => t.is_complete);
  const allExpanded = collapsedIds.size === 0;

  const incompleteFlat = useMemo(
    () => flattenVisible(incomplete, collapsedIds),
    [incomplete, collapsedIds],
  );
  const completeFlat = useMemo(
    () => flattenVisible(complete, collapsedIds),
    [complete, collapsedIds],
  );

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        {/* Logo — left:8, top:10, 42×42 — taps open theme picker */}
        <View ref={logoBtnRef} collapsable={false} style={styles.logoBtn}>
          <TouchableOpacity
            style={styles.logoBtn}
            onPress={() => {
              if (themePickerLayout) { setThemePickerLayout(null); return; }
              logoBtnRef.current?.measure((x, y, w, h, pageX, pageY) => {
                setThemePickerLayout({ top: pageY + h + 4, left: pageX });
              });
            }}
          >
            <IconLogo size={42} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        {/* List selector — left:60, top:15, 189×34 */}
        <TouchableOpacity
          style={[styles.listSelector, { backgroundColor: theme.listSelectorBg, borderBottomColor: theme.listSelectorBorder }]}
          onPress={() => setShowListPicker(true)}
        >
          <Text style={[styles.listSelectorText, { color: theme.listSelectorText }]} numberOfLines={1}>
            {activeList?.name ?? '…'}
          </Text>
          <Text style={[styles.listSelectorArrow, { color: theme.listSelectorText }]}>▼</Text>
        </TouchableOpacity>

        {/* List gear — left:260, top:20, 24×24 */}
        <TouchableOpacity style={styles.gearBtn}>
          <IconSettings size={24} color={theme.iconColor} />
        </TouchableOpacity>

        {/* Help — right:21, top:20, 24×24 */}
        <TouchableOpacity style={styles.helpBtn}>
          <IconHelp size={24} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      {/* List picker modal */}
      <Modal visible={showListPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowListPicker(false)}
        >
          <View style={[styles.listPickerDropdown, { backgroundColor: theme.listSelectorBg, borderColor: theme.border }]}>
            {lists.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.listPickerItem, { borderBottomColor: theme.border }, l.id === activeListId && { backgroundColor: theme.surface }]}
                onPress={() => switchToList(l.id)}
              >
                <Text style={[styles.listPickerText, { color: theme.listSelectorText }, l.id === activeListId && styles.listPickerTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme picker dropdown */}
      {themePickerLayout && (
        <Modal visible transparent animationType="none" onRequestClose={() => setThemePickerLayout(null)}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setThemePickerLayout(null)} />
          <View style={[
            styles.themeDropdown,
            { backgroundColor: theme.surface, borderColor: theme.border, top: themePickerLayout.top, left: themePickerLayout.left },
          ]}>
            {Object.values(themes).map((th, i, arr) => (
              <TouchableOpacity
                key={th.id}
                style={[styles.themeItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={() => { setThemeId(th.id); setThemePickerLayout(null); }}
              >
                <Text style={[styles.themeItemText, { color: themeId === th.id ? theme.accent : theme.text }, themeId === th.id && styles.themeItemActive]}>
                  {th.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}

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
        buttonLayout={itemMenuLayout}
        onClose={closeItemMenu}
        onEdit={() => { if (itemMenuTodo) openEdit(itemMenuTodo); }}
        onDelete={handleItemDelete}
        onSetStatus={(status) => { if (itemMenuTodo) setStatus(itemMenuTodo.id, status); }}
        onAddImage={() => { if (itemMenuTodo) handleAddImage(itemMenuTodo); }}
        onAddUrl={() => { if (itemMenuTodo) handleAddUrl(itemMenuTodo); }}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onExportForAI={handleExportForAI}
        imageCount={itemMenuImageCount}
        hasNote={!!(itemMenuTodo?.note)}
      />

      {/* Note add/edit modal */}
      <AddEditModal
        visible={noteModalVisible}
        title={noteEditingTodo?.note ? 'Edit note' : 'Add note'}
        initialTask=""
        initialNote={noteEditingTodo?.note ?? ''}
        noteMode
        onClose={() => { setNoteModalVisible(false); setNoteEditingTodo(null); }}
        onSave={handleSaveNote}
      />

      {/* Add link modal */}
      <AddLinkModal
        visible={showLinkModal}
        onClose={() => { setShowLinkModal(false); setLinkTargetTodo(null); }}
        onSave={handleSaveLink}
      />

      {/* ── Todo list ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.iconColor} />
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {incompleteFlat.length === 0 && (
              <Text style={[styles.emptyState, { color: theme.textSub }]}>No tasks yet.</Text>
            )}
            <DraggableFlatList
              data={incompleteFlat}
              keyExtractor={item => String(item.todo.id)}
              scrollEnabled={false}
              onDragBegin={handleDragBegin}
              onDragEnd={handleDragEnd}
              renderItem={({ item, drag, isActive }: RenderItemParams<FlatItem>) => (
                <ScaleDecorator>
                  <TodoItem
                    todo={item.todo}
                    depth={item.depth}
                    onToggleCollapse={toggleCollapse}
                    onToggleComplete={toggleComplete}
                    onOptions={handleOptions}
                    onAddSubtask={id => openAdd(id)}
                    imageRefreshToken={imageRefreshToken}
                    linkRefreshToken={linkRefreshToken}
                    onDrag={drag}
                    isBeingDragged={isActive}
                  />
                </ScaleDecorator>
              )}
              renderPlaceholder={() => (
                <View style={[styles.dropIndicator, { backgroundColor: theme.accent }]} />
              )}
            />
          </View>

          {completeFlat.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }, styles.sectionDone]}>
              <Text style={[styles.sectionLabel, { color: theme.accent }]}>Completed</Text>
              {completeFlat.map(item => (
                <TodoItem
                  key={item.todo.id}
                  todo={item.todo}
                  depth={item.depth}
                  onToggleCollapse={toggleCollapse}
                  onToggleComplete={toggleComplete}
                  onOptions={handleOptions}
                  onAddSubtask={id => openAdd(id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Bottom toolbar ── */}
      <View style={[styles.toolbarOuter, { backgroundColor: theme.headerBg, borderTopColor: theme.headerBorder, paddingBottom: insets.bottom }]}>
        <View style={styles.toolbarInner}>
          <TouchableOpacity style={styles.toolbarLeft} onPress={() => setShowToolbarMenu(true)}>
            <IconOptions size={24} color={theme.iconColor} />
          </TouchableOpacity>

          <View style={styles.toolbarCenter}>
            <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => openAdd(null, 'bottom')}>
              <IconAddBottom size={18} color={theme.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.newLabel, { color: theme.iconColor }]}>new</Text>
            <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => openAdd(null, 'top')}>
              <IconAddTop size={18} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.toolbarRight} onPress={toggleAll}>
            {allExpanded
              ? <IconExpandUp size={24} color={theme.iconColor} />
              : <IconExpandDown size={24} color={theme.iconColor} />
            }
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    height: 64,
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
    borderBottomWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    gap: 6,
  },
  listSelectorText: {
    flex: 1,
    fontSize: 15,
  },
  listSelectorArrow: {
    fontSize: 10,
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

  // ── Theme picker ──
  themeDropdown: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 4,
    minWidth: 160,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  themeItem: {
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  themeItemText: {
    fontSize: 16,
  },
  themeItemActive: {
    fontWeight: '600',
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
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  listPickerText: {
    fontSize: 15,
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
    margin: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  sectionDone: {
    opacity: 0.75,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  dropIndicator: {
    height: 2,
    marginHorizontal: 12,
    borderRadius: 1,
  },

  // ── Toolbar ──
  toolbarOuter: {
    borderTopWidth: 1,
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
