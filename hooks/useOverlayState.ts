import { useState, useCallback } from 'react';
import { Alert, Share, ToastAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase/client';
import type { Todo } from '../lib/types';
import { getImages, addImages, MAX_IMAGES } from '../lib/imageStore';
import { addLink, getLinks } from '../lib/linkStore';
import type { ButtonLayout } from '../components/ItemOptionsMenu';
import type { TodoData } from './useTodoData';
import { formatItemTree } from './useTodoData';

export function useOverlayState(data: TodoData) {
  const {
    deleteTask, updateTask, fetchTodos,
    activeListId, activeList, userId, todos, openEdit,
  } = data;

  // Item options menu
  const [itemMenuTodo, setItemMenuTodo] = useState<Todo | null>(null);
  const [itemMenuDepth, setItemMenuDepth] = useState(0);
  const [itemMenuLayout, setItemMenuLayout] = useState<ButtonLayout | null>(null);
  const [itemMenuImageCount, setItemMenuImageCount] = useState(0);

  // Toolbar menu
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);

  // Note modal
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteEditingTodo, setNoteEditingTodo] = useState<Todo | null>(null);

  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetTodo, setLinkTargetTodo] = useState<Todo | null>(null);

  // Per-item refresh tokens — only the affected item sees a token bump
  const [imageTokens, setImageTokens] = useState<Record<number, number>>({});
  const [linkTokens, setLinkTokens] = useState<Record<number, number>>({});

  // ── Item menu ────────────────────────────────────────────────────────────

  const handleOptions = useCallback(async (todo: Todo, depth: number, layout: ButtonLayout) => {
    const images = await getImages(todo.id);
    setItemMenuImageCount(images.length);
    setItemMenuTodo(todo);
    setItemMenuDepth(depth);
    setItemMenuLayout(layout);
  }, []);

  const closeItemMenu = useCallback(() => {
    setItemMenuTodo(null);
    setItemMenuLayout(null);
  }, []);

  // ── Image / link ─────────────────────────────────────────────────────────

  const handleAddImage = useCallback(async (todo: Todo) => {
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
    setImageTokens(prev => ({ ...prev, [todo.id]: (prev[todo.id] ?? 0) + 1 }));

    if (uris.length < result.assets.length) {
      ToastAndroid.show(
        `Only ${slots} slot${slots === 1 ? '' : 's'} remaining — added ${uris.length}`,
        ToastAndroid.SHORT,
      );
    }
  }, []);

  const handleAddUrl = useCallback((todo: Todo) => {
    setLinkTargetTodo(todo);
    setShowLinkModal(true);
  }, []);

  const handleSaveLink = useCallback(async (url: string, name: string) => {
    setShowLinkModal(false);
    if (!linkTargetTodo || !userId) return;
    const existing = await getLinks(linkTargetTodo.id);
    await addLink(userId, linkTargetTodo.id, url, name || null, existing.length);
    setLinkTokens(prev => ({ ...prev, [linkTargetTodo.id]: (prev[linkTargetTodo.id] ?? 0) + 1 }));
    setLinkTargetTodo(null);
  }, [linkTargetTodo, userId]);

  // ── Note ─────────────────────────────────────────────────────────────────

  const handleEditNote = useCallback(() => {
    if (!itemMenuTodo) return;
    setNoteEditingTodo(itemMenuTodo);
    setNoteModalVisible(true);
  }, [itemMenuTodo]);

  const handleSaveNote = useCallback(async (_task: string, note: string) => {
    setNoteModalVisible(false);
    if (!noteEditingTodo || !activeListId) return;
    await supabase.from('todos').update({ note: note || null }).eq('id', noteEditingTodo.id);
    fetchTodos(activeListId, false);
    setNoteEditingTodo(null);
  }, [noteEditingTodo, activeListId, fetchTodos]);

  const handleDeleteNote = useCallback(async () => {
    if (!itemMenuTodo || !activeListId) return;
    await supabase.from('todos').update({ note: null }).eq('id', itemMenuTodo.id);
    fetchTodos(activeListId, false);
  }, [itemMenuTodo, activeListId, fetchTodos]);

  // ── Export / delete ──────────────────────────────────────────────────────

  const handleExportForAI = useCallback(async () => {
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
    try { await Share.share({ message: text, title: 'TurboTodo Export' }); } catch {}
  }, [itemMenuTodo, activeList]);

  const handleItemDelete = useCallback(() => {
    if (!itemMenuTodo || !activeListId) return;
    Alert.alert(
      'Delete task?',
      `"${itemMenuTodo.task}" and any subtasks will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(itemMenuTodo.id, todos, activeListId) },
      ],
      { cancelable: true },
    );
  }, [itemMenuTodo, activeListId, todos, deleteTask]);

  const handleMenuEdit = useCallback(() => {
    if (itemMenuTodo) openEdit(itemMenuTodo);
  }, [itemMenuTodo, openEdit]);

  const handleMenuSetStatus = useCallback((status: string | null) => {
    if (itemMenuTodo && activeListId) data.setStatus(itemMenuTodo.id, status, activeListId);
  }, [itemMenuTodo, activeListId, data]);

  const handleMenuAddImage = useCallback(() => {
    if (itemMenuTodo) handleAddImage(itemMenuTodo);
  }, [itemMenuTodo, handleAddImage]);

  const handleMenuAddUrl = useCallback(() => {
    if (itemMenuTodo) handleAddUrl(itemMenuTodo);
  }, [itemMenuTodo, handleAddUrl]);

  return {
    // menu
    showToolbarMenu, setShowToolbarMenu,
    itemMenuTodo, itemMenuDepth, itemMenuLayout, itemMenuImageCount,
    handleOptions, closeItemMenu,
    // item menu actions (pre-bound to itemMenuTodo)
    handleMenuEdit, handleMenuSetStatus, handleMenuAddImage, handleMenuAddUrl,
    handleEditNote, handleDeleteNote, handleExportForAI, handleItemDelete,
    // note modal
    noteModalVisible, setNoteModalVisible, noteEditingTodo, setNoteEditingTodo,
    handleSaveNote,
    // link modal
    showLinkModal, setShowLinkModal, linkTargetTodo, setLinkTargetTodo,
    handleSaveLink,
    // per-item refresh tokens
    imageTokens, linkTokens,
  };
}
