import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase/client';
import type { Todo, List } from '../lib/types';
import TodoItem from './TodoItem';

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
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [showListPicker, setShowListPicker] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

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
    const { data } = await supabase
      .from('lists')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('inserted_at', { ascending: true });

    let loadedLists = (data as List[]) || [];

    if (loadedLists.length === 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.listSelector}
          onPress={() => setShowListPicker(true)}
        >
          <Text style={styles.listSelectorText} numberOfLines={1}>
            {activeList?.name ?? '…'}
          </Text>
          <Text style={styles.listSelectorArrow}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleAll} style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>{allExpanded ? '⌃' : '⌄'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
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

      {/* Todo list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#025f96" />
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Incomplete */}
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
              />
            ))}
          </View>

          {/* Completed */}
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
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003759',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: '#F6CD75',
  },
  listSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe8a9',
    borderBottomWidth: 1,
    borderBottomColor: '#023455',
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  expandBtn: {
    padding: 8,
  },
  expandBtnText: {
    fontSize: 20,
    color: '#025f96',
  },
  signOutBtn: {
    padding: 8,
  },
  signOutText: {
    fontSize: 13,
    color: '#6a3f1f',
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
});
