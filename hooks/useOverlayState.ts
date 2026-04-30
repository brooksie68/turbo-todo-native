import { useState, useCallback } from 'react';
import { Alert, Share, ToastAndroid } from 'react-native';
import { requestNotificationPermission, scheduleAlarm, cancelAlarm } from '../lib/alarms';
import * as ImagePicker from 'expo-image-picker';
import type { Todo } from '../lib/types';
import { getImages, addImages, MAX_IMAGES } from '../lib/imageStore';
import { addLink, getLinks } from '../lib/linkStore';
import type { ButtonLayout } from '../components/ItemOptionsMenu';
import type { TodoData } from './useTodoData';
import { formatItemTree } from './useTodoData';

export function useOverlayState(data: TodoData) {
  const {
    deleteTask, saveNote, setPinned, clearCompletedInGroup,
    sendToDaily, restoreFromDaily,
    activeListId, activeList, todos, openEdit, refreshMedia, expandItem,
  } = data;

  // Item options menu
  const [itemMenuTodo, setItemMenuTodo] = useState<Todo | null>(null);
  const [itemMenuDepth, setItemMenuDepth] = useState(0);
  const [itemMenuLayout, setItemMenuLayout] = useState<ButtonLayout | null>(null);
  const [itemMenuImageCount, setItemMenuImageCount] = useState(0);
  const [itemMenuHasCompletedChildren, setItemMenuHasCompletedChildren] = useState(false);
  const [itemMenuIsSingleton, setItemMenuIsSingleton] = useState(false);
  const [itemMenuHasSource, setItemMenuHasSource] = useState(false);

  // Add-child menu (depth-0 + button)
  const [addMenuTodo, setAddMenuTodo] = useState<Todo | null>(null);
  const [addMenuLayout, setAddMenuLayout] = useState<ButtonLayout | null>(null);

  // Toolbar menu
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);

  // Note modal
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteEditingTodo, setNoteEditingTodo] = useState<Todo | null>(null);

  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetTodo, setLinkTargetTodo] = useState<Todo | null>(null);

  // Alarm modal
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [alarmModalTodo, setAlarmModalTodo] = useState<Todo | null>(null);

  // ── Add-child menu ───────────────────────────────────────────────────────

  const handleShowAddMenu = useCallback((todo: Todo, _depth: number, layout: ButtonLayout) => {
    setAddMenuTodo(todo);
    setAddMenuLayout(layout);
  }, []);

  const closeAddMenu = useCallback(() => {
    setAddMenuTodo(null);
    setAddMenuLayout(null);
  }, []);

  const handleAddMenuSubtask = useCallback(() => {
    if (addMenuTodo) data.openAdd(addMenuTodo.id, 'top');
  }, [addMenuTodo, data.openAdd]);

  const handleAddMenuImage = useCallback(() => {
    if (addMenuTodo) handleAddImage(addMenuTodo);
    // handleAddImage defined later in this scope — stable useCallback ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMenuTodo]);

  const handleAddMenuTakePhoto = useCallback(() => {
    if (addMenuTodo) handleTakePhoto(addMenuTodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMenuTodo]);

  const handleAddMenuUrl = useCallback(() => {
    if (addMenuTodo) handleAddUrl(addMenuTodo);
    // handleAddUrl defined later in this scope — stable useCallback ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMenuTodo]);

  const handleAddMenuNote = useCallback(() => {
    if (!addMenuTodo) return;
    setNoteEditingTodo(addMenuTodo);
    setNoteModalVisible(true);
  }, [addMenuTodo]);

  // ── Item menu ────────────────────────────────────────────────────────────

  const handleOptions = useCallback(async (todo: Todo, depth: number, layout: ButtonLayout) => {
    const images = await getImages(todo.id);
    setItemMenuImageCount(images.length);
    function anyCompleted(nodes: Todo[]): boolean {
      for (const n of nodes) {
        if (n.is_complete) return true;
        if (n.children && anyCompleted(n.children)) return true;
      }
      return false;
    }
    setItemMenuHasCompletedChildren(anyCompleted(todo.children ?? []));
    setItemMenuIsSingleton((todo.children?.length ?? 0) === 0);
    setItemMenuHasSource(!!(todo.daily_source_list_id));
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
    refreshMedia();
    expandItem(todo.parent_id ?? todo.id);

    if (uris.length < result.assets.length) {
      ToastAndroid.show(
        `Only ${slots} slot${slots === 1 ? '' : 's'} remaining — added ${uris.length}`,
        ToastAndroid.SHORT,
      );
    }
  }, [refreshMedia]);

  const handleTakePhoto = useCallback(async (todo: Todo) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return;
    }
    const existing = await getImages(todo.id);
    if (existing.length >= MAX_IMAGES) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    await addImages(todo.id, [result.assets[0].uri]);
    refreshMedia();
    expandItem(todo.parent_id ?? todo.id);
  }, [refreshMedia, expandItem]);

  const handleAddUrl = useCallback((todo: Todo) => {
    setLinkTargetTodo(todo);
    setShowLinkModal(true);
  }, []);

  const handleSaveLink = useCallback(async (url: string, name: string) => {
    setShowLinkModal(false);
    if (!linkTargetTodo) return;
    const existing = await getLinks(linkTargetTodo.id);
    await addLink(linkTargetTodo.id, url, name || null, existing.length);
    refreshMedia();
    expandItem(linkTargetTodo.parent_id ?? linkTargetTodo.id);
    setLinkTargetTodo(null);
  }, [linkTargetTodo, refreshMedia]);

  // ── Note ─────────────────────────────────────────────────────────────────

  const handleEditNote = useCallback(() => {
    if (!itemMenuTodo) return;
    setNoteEditingTodo(itemMenuTodo);
    setNoteModalVisible(true);
  }, [itemMenuTodo]);

  const handleSaveNote = useCallback(async (_task: string, note: string) => {
    setNoteModalVisible(false);
    if (!noteEditingTodo || !activeListId) return;
    await saveNote(noteEditingTodo.id, note || null, activeListId);
    expandItem(noteEditingTodo.parent_id ?? noteEditingTodo.id);
    setNoteEditingTodo(null);
  }, [noteEditingTodo, activeListId, saveNote]);

  const handleDeleteNote = useCallback(async () => {
    if (!itemMenuTodo || !activeListId) return;
    await saveNote(itemMenuTodo.id, null, activeListId);
  }, [itemMenuTodo, activeListId, saveNote]);

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

  const handleMenuPin = useCallback(() => {
    if (itemMenuTodo) setPinned(itemMenuTodo.id, !itemMenuTodo.pinned);
  }, [itemMenuTodo, setPinned]);

  const handleMenuClearCompletedInGroup = useCallback(() => {
    if (itemMenuTodo) clearCompletedInGroup(itemMenuTodo.id, todos);
  }, [itemMenuTodo, todos, clearCompletedInGroup]);

  const handleMenuSendToDaily = useCallback(() => {
    if (itemMenuTodo) sendToDaily(itemMenuTodo);
  }, [itemMenuTodo, sendToDaily]);

  const handleMenuRestoreFromDaily = useCallback(() => {
    if (itemMenuTodo) restoreFromDaily(itemMenuTodo);
  }, [itemMenuTodo, restoreFromDaily]);

  const handleMenuSetAlarm = useCallback(() => {
    if (!itemMenuTodo) return;
    setAlarmModalTodo(itemMenuTodo);
    setAlarmModalVisible(true);
  }, [itemMenuTodo]);

  const handleAlarmSave = useCallback(async (time: string) => {
    setAlarmModalVisible(false);
    if (!alarmModalTodo) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Permission needed', 'Allow notifications to set alarms.');
      setAlarmModalTodo(null);
      return;
    }
    if (alarmModalTodo.notification_id) {
      await cancelAlarm(alarmModalTodo.notification_id);
    }
    const notifId = await scheduleAlarm(alarmModalTodo, time);
    data.setAlarmOnTodo(alarmModalTodo.id, time, notifId);
    setAlarmModalTodo(null);
  }, [alarmModalTodo, data]);

  const handleAlarmRemove = useCallback(async () => {
    setAlarmModalVisible(false);
    if (!alarmModalTodo?.notification_id) {
      setAlarmModalTodo(null);
      return;
    }
    await data.clearAlarmOnTodo(alarmModalTodo.id, alarmModalTodo.notification_id);
    setAlarmModalTodo(null);
  }, [alarmModalTodo, data]);

  return {
    // menu
    showToolbarMenu, setShowToolbarMenu,
    itemMenuTodo, itemMenuDepth, itemMenuLayout, itemMenuImageCount,
    handleOptions, closeItemMenu,
    // add-child menu
    addMenuTodo, addMenuLayout,
    handleShowAddMenu, closeAddMenu,
    handleAddMenuSubtask, handleAddMenuImage, handleAddMenuTakePhoto, handleAddMenuUrl, handleAddMenuNote,
    // item menu actions (pre-bound to itemMenuTodo)
    handleMenuEdit, handleMenuSetStatus, handleMenuAddImage, handleMenuAddUrl,
    handleMenuPin, handleMenuClearCompletedInGroup,
    handleMenuSendToDaily, handleMenuRestoreFromDaily,
    itemMenuHasCompletedChildren, itemMenuIsSingleton, itemMenuHasSource,
    handleEditNote, handleDeleteNote, handleExportForAI, handleItemDelete,
    // note modal
    noteModalVisible, setNoteModalVisible, noteEditingTodo, setNoteEditingTodo,
    handleSaveNote,
    // link modal
    showLinkModal, setShowLinkModal, linkTargetTodo, setLinkTargetTodo,
    handleSaveLink,
    // alarm modal
    alarmModalVisible, alarmModalTodo,
    handleMenuSetAlarm, handleAlarmSave, handleAlarmRemove,
    closeAlarmModal: () => { setAlarmModalVisible(false); setAlarmModalTodo(null); },
  };
}
