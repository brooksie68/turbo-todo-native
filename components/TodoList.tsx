import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import type { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FlatItem } from '../hooks/useTodoData';
import { useTodoData } from '../hooks/useTodoData';
import { useOverlayState } from '../hooks/useOverlayState';
import TodoItem from './TodoItem';
import TodoListHeader from './TodoListHeader';
import TodoListToolbar from './TodoListToolbar';
import ImageViewer from './ImageViewer';
import AddEditModal from './AddEditModal';
import AddLinkModal from './AddLinkModal';
import ToolbarOptionsMenu from './ToolbarOptionsMenu';
import ItemOptionsMenu from './ItemOptionsMenu';
import AddChildMenu from './AddChildMenu';
import { useTheme, useThemeContext } from '../lib/theme';
import { exportBackup, importBackup } from '../lib/backup';
import HelpModal from './HelpModal';
import AlarmModal from './AlarmModal';

// Renders LinearGradient for themes that define gradientColors, plain View otherwise.
function ThemeBg({ style, children }: { style: object; children: React.ReactNode }) {
  const { theme } = useThemeContext();
  if (theme.gradientColors) {
    return (
      <LinearGradient
        colors={theme.gradientColors as [string, string, ...string[]]}
        locations={(theme.gradientLocations ?? undefined) as [number, number, ...number[]] | undefined}
        style={style}
      >
        {children}
      </LinearGradient>
    );
  }
  return <View style={[style, { backgroundColor: theme.bg }]}>{children}</View>;
}

export default function TodoList() {
  const theme = useTheme();
  const { theme: themeCtx } = useThemeContext();

  const data = useTodoData();
  const overlay = useOverlayState(data);


  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [listKey, setListKey] = useState(0);
  const dragFromIndexRef = useRef<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

  // ── Drop validity ────────────────────────────────────────────────────────

  const isDropValid = useCallback((fromIdx: number, toIdx: number): boolean => {
    const flat = data.incompleteFlat;
    const dragged = flat[fromIdx];
    if (!dragged) return true;

    // Simulate what's immediately after the dragged item post-move.
    // When dragging down (fromIdx < toIdx): items shift left, so flat[toIdx+1] stays.
    // When dragging up (fromIdx > toIdx): flat[toIdx] shifts right, becoming toIdx+1.
    const nextItem = fromIdx < toIdx ? flat[toIdx + 1] : flat[toIdx];

    if (dragged.depth === 0) {
      const pinnedCount = flat.filter((fi, i) => i !== fromIdx && fi.depth === 0 && fi.todo.pinned).length;
      if (toIdx < pinnedCount) return false;
      // Can't land between a root and its children
      if (nextItem && nextItem.depth > 0) return false;
      return true;
    }
    const parentPos = flat.findIndex(fi => fi.todo.id === dragged.parentId);
    if (parentPos === -1 || toIdx <= parentPos) return false;
    for (let i = parentPos + 1; i < toIdx; i++) {
      if (i === fromIdx) continue;
      if (flat[i].depth < dragged.depth) return false;
    }
    // Can't land between another item and its deeper children
    if (nextItem && nextItem.depth > dragged.depth && nextItem.parentId !== dragged.todo.id) return false;
    return true;
  }, [data.incompleteFlat]);

  // ── Callbacks ────────────────────────────────────────────────────────────

  const handleAddSubtask = useCallback((id: number) => {
    data.openAdd(id, 'top');
  }, [data.openAdd]);

  const handleModalSave = useCallback((task: string, note: string) => {
    data.setModalVisible(false);
    if (data.editingId !== null) {
      if (data.activeListId) data.updateTask(data.editingId, task, note, data.activeListId);
    } else {
      if (data.activeListId) {
        data.addTask(task, note, data.addParentId, data.insertPosition, data.activeListId);
        if (data.addParentId !== null) data.expandItem(data.addParentId);
      }
    }
  }, [data]);

  const handleSort = useCallback((criterion: string) => {
    if (data.activeListId) data.handleSort(criterion, data.activeListId);
  }, [data.activeListId, data.handleSort]);

  const handleBackup = useCallback(async () => {
    try {
      ToastAndroid.show('Preparing backup…', ToastAndroid.SHORT);
      await exportBackup();
    } catch {
      ToastAndroid.show('Backup failed', ToastAndroid.SHORT);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    try {
      const ok = await importBackup();
      if (ok) {
        await data.fetchLists();
        if (data.activeListId !== null) await data.fetchTodos(data.activeListId, false);
        ToastAndroid.show('Restored from backup', ToastAndroid.SHORT);
      }
    } catch {
      ToastAndroid.show('Restore failed — invalid backup file', ToastAndroid.SHORT);
    }
  }, [data.fetchLists, data.activeListId, data.fetchTodos]);

  const handleClearCompleted = useCallback(() => {
    if (data.activeListId) data.handleClearCompleted(data.todos, data.activeListId);
  }, [data.todos, data.activeListId, data.handleClearCompleted]);

  const handleDeleteNoteInline = useCallback((id: number) => {
    if (data.activeListId) data.saveNote(id, null, data.activeListId);
  }, [data.saveNote, data.activeListId]);

  const handleClearAll = useCallback(() => {
    if (data.activeListId) data.handleClearAll(data.todos, data.activeListId);
  }, [data.todos, data.activeListId, data.handleClearAll]);

  const handleDailyOn = useCallback(() => {
    if (!data.dailyEnabled) data.enableDaily();
  }, [data.dailyEnabled, data.enableDaily]);

  const handleDailyOff = useCallback(async () => {
    if (!data.dailyEnabled) return;
    const count = await data.getDailyItemCount();
    if (count > 0) {
      Alert.alert(
        'Daily List has items',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore & Turn Off', onPress: () => data.disableDaily(true) },
          { text: 'Turn Off', style: 'destructive', onPress: () => data.disableDaily(false) },
        ],
      );
    } else {
      data.disableDaily(false);
    }
  }, [data.dailyEnabled, data.getDailyItemCount, data.disableDaily]);

  const handleToggleAll = useCallback(() => {
    data.toggleAll(data.anyDepth0Expanded);
  }, [data.anyDepth0Expanded, data.toggleAll]);

  const handleDragBegin = useCallback((index: number) => {
    dragFromIndexRef.current = index;
    data.handleDragBegin(index, data.incompleteFlat);
  }, [data.handleDragBegin, data.incompleteFlat]);

  const handleDragEnd = useCallback(async ({ data: newFlat, from, to }: { data: FlatItem[]; from: number; to: number }) => {
    dragFromIndexRef.current = null;
    setDragTargetIndex(null);
    if (data.activeListId) {
      const valid = await data.handleDragEnd(newFlat, from, to, data.activeListId);
      if (!valid) setListKey(k => k + 1);
    }
  }, [data.activeListId, data.handleDragEnd]);

  // ── Renderers ────────────────────���──────────────────────────────���────────

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<FlatItem>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item.todo}
        depth={item.depth}
        isCollapsed={data.collapsedIds.has(item.todo.id)}
        onToggleCollapse={data.toggleCollapse}
        onToggleComplete={data.toggleComplete}
        onOptions={overlay.handleOptions}
        onAddSubtask={handleAddSubtask}
        onShowAddMenu={overlay.handleShowAddMenu}
        images={data.imageMap[item.todo.id]}
        links={data.linkMap[item.todo.id]}
        onViewImage={setViewerUri}
        onMediaChanged={data.refreshMedia}
        onDrag={drag}
        isBeingDragged={isActive}
        positionLabel={item.positionLabel}
        onDeleteNote={handleDeleteNoteInline}
      />
    </ScaleDecorator>
  ), [
    data.toggleCollapse, data.toggleComplete,
    data.imageMap, data.linkMap, data.refreshMedia,
    data.collapsedIds, overlay.handleOptions, handleAddSubtask, overlay.handleShowAddMenu,
  ]);

  const renderCompletedItem = useCallback(({ item }: { item: FlatItem }) => (
    <TodoItem
      todo={item.todo}
      depth={item.depth}
      isCollapsed={data.collapsedIds.has(item.todo.id)}
      onToggleCollapse={data.toggleCollapse}
      onToggleComplete={data.toggleComplete}
      onOptions={overlay.handleOptions}
      onAddSubtask={handleAddSubtask}
      onShowAddMenu={overlay.handleShowAddMenu}
      images={data.imageMap[item.todo.id]}
      links={data.linkMap[item.todo.id]}
      onViewImage={setViewerUri}
      onMediaChanged={data.refreshMedia}
      onDeleteNote={handleDeleteNoteInline}
    />
  ), [
    data.toggleCollapse, data.toggleComplete,
    data.imageMap, data.linkMap, data.refreshMedia,
    data.collapsedIds, overlay.handleOptions, handleAddSubtask, overlay.handleShowAddMenu,
  ]);

  const listFooter = data.completeFlat.length > 0 ? (
    <FlatList
      data={data.completeFlat}
      keyExtractor={item => String(item.todo.id)}
      renderItem={renderCompletedItem}
      scrollEnabled={false}
      style={[styles.section, { backgroundColor: themeCtx.surface, borderColor: themeCtx.border }, styles.sectionDone]}
      ListHeaderComponent={<Text style={[styles.sectionLabel, { color: themeCtx.accent }]}>Completed</Text>}
    />
  ) : null;

  // ── Render ─────────────────────────────���─────────────────────────────���───

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeCtx.bg }]} edges={['top']}>
      <ThemeBg style={styles.container}>

        <TodoListHeader
          lists={data.lists}
          activeListId={data.activeListId}
          activeList={data.activeList}
          isDailyList={data.isDailyList}
          onSwitchList={data.switchToList}
          onCreateList={data.createList}
          onRenameList={data.renameList}
          onDeleteList={data.deleteList}
          onHelp={() => setShowHelp(true)}
        />

        {/* Modals */}
        <AddEditModal
          visible={data.modalVisible}
          title={data.modalTitle}
          initialTask={data.modalInitialTask}
          initialNote={data.modalInitialNote}
          onClose={() => data.setModalVisible(false)}
          onSave={handleModalSave}
        />
        <ToolbarOptionsMenu
          visible={overlay.showToolbarMenu}
          onClose={() => overlay.setShowToolbarMenu(false)}
          onSort={handleSort}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
          onBackup={handleBackup}
          onRestore={handleRestore}
          dailyEnabled={data.dailyEnabled}
          onDailyOn={handleDailyOn}
          onDailyOff={handleDailyOff}
        />
        <ItemOptionsMenu
          visible={overlay.itemMenuTodo !== null}
          todo={overlay.itemMenuTodo}
          depth={overlay.itemMenuDepth}
          buttonLayout={overlay.itemMenuLayout}
          onClose={overlay.closeItemMenu}
          onEdit={overlay.handleMenuEdit}
          onDelete={overlay.handleItemDelete}
          onSetStatus={overlay.handleMenuSetStatus}
          onPin={overlay.handleMenuPin}
          onAddImage={overlay.handleMenuAddImage}
          onAddUrl={overlay.handleMenuAddUrl}
          onEditNote={overlay.handleEditNote}
          onDeleteNote={overlay.handleDeleteNote}
          onExportForAI={overlay.handleExportForAI}
          onSetAlarm={overlay.handleMenuSetAlarm}
          onClearCompletedInGroup={overlay.handleMenuClearCompletedInGroup}
          onSendToDaily={overlay.handleMenuSendToDaily}
          onRestoreFromDaily={overlay.handleMenuRestoreFromDaily}
          imageCount={overlay.itemMenuImageCount}
          hasNote={!!(overlay.itemMenuTodo?.note)}
          hasCompletedChildren={overlay.itemMenuHasCompletedChildren}
          dailyEnabled={data.dailyEnabled}
          isDailyList={data.isDailyList}
          isSingleton={overlay.itemMenuIsSingleton}
          hasSource={overlay.itemMenuHasSource}
        />
        <AddEditModal
          visible={overlay.noteModalVisible}
          title={overlay.noteEditingTodo?.note ? 'Edit note' : 'Add note'}
          initialTask=""
          initialNote={overlay.noteEditingTodo?.note ?? ''}
          noteMode
          onClose={() => { overlay.setNoteModalVisible(false); overlay.setNoteEditingTodo(null); }}
          onSave={overlay.handleSaveNote}
        />
        <AddLinkModal
          visible={overlay.showLinkModal}
          onClose={() => { overlay.setShowLinkModal(false); overlay.setLinkTargetTodo(null); }}
          onSave={overlay.handleSaveLink}
        />
        <AddChildMenu
          visible={overlay.addMenuTodo !== null}
          buttonLayout={overlay.addMenuLayout}
          onClose={overlay.closeAddMenu}
          onAddSubtask={overlay.handleAddMenuSubtask}
          onAddImage={overlay.handleAddMenuImage}
          onAddUrl={overlay.handleAddMenuUrl}
          onAddNote={overlay.handleAddMenuNote}
          hideSubtask={data.isDailyList}
        />

        {/* Todo list */}
        <View style={styles.scrollWrapper}>
          {data.loading ? (
            <View style={[styles.loadingContainer, styles.scrollArea, { backgroundColor: themeCtx.surface, borderColor: themeCtx.listSelectorBorder }]}>
              <ActivityIndicator color={themeCtx.iconColor} />
            </View>
          ) : (
            <DraggableFlatList
              key={listKey}
              data={data.incompleteFlat}
              keyExtractor={item => String(item.todo.id)}
              containerStyle={[styles.scrollArea, { backgroundColor: themeCtx.surface, borderColor: themeCtx.listSelectorBorder }]}
              contentContainerStyle={styles.scrollContent}
              onDragBegin={handleDragBegin}
              onDragEnd={handleDragEnd}
              onPlaceholderIndexChange={i => { setDragTargetIndex(i); }}
              renderItem={renderItem}
              renderPlaceholder={() => {
                const from = dragFromIndexRef.current;
                const to = dragTargetIndex;
                const valid = from === null || to === null || isDropValid(from, to);
                return (
                  <View style={[
                    styles.dropIndicator,
                    { backgroundColor: valid ? themeCtx.accent : '#cc3300', height: valid ? 2 : 3 },
                  ]} />
                );
              }}
              ListHeaderComponent={data.incompleteFlat.length === 0 ? (
                <Text style={[styles.emptyState, { color: themeCtx.textSub }]}>No tasks yet.</Text>
              ) : null}
              ListFooterComponent={listFooter}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0)']}
            style={styles.shadowTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.10)']}
            style={styles.shadowBottom}
            pointerEvents="none"
          />
        </View>

        <TodoListToolbar
          onOpenMenu={() => overlay.setShowToolbarMenu(true)}
          onAddNew={() => data.openAdd(null, 'top')}
          onToggleAll={handleToggleAll}
          allExpanded={data.anyDepth0Expanded}
        />

        <ImageViewer
          visible={viewerUri !== null}
          uri={viewerUri}
          onClose={() => setViewerUri(null)}
        />

        <AlarmModal
          visible={overlay.alarmModalVisible}
          initialTime={overlay.alarmModalTodo?.alarm_time}
          onSave={overlay.handleAlarmSave}
          onRemove={overlay.handleAlarmRemove}
          onClose={overlay.closeAlarmModal}
        />

        <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />

      </ThemeBg>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollWrapper: { flex: 1, marginHorizontal: 6, position: 'relative' },
  scrollArea: { flex: 1, borderWidth: 1, borderRadius: 2 },
  shadowTop: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 8,
  },
  shadowBottom: {
    position: 'absolute',
    bottom: 1,
    left: 1,
    right: 1,
    height: 8,
  },
  scrollContent: { paddingBottom: 8 },
  section: { margin: 8, borderRadius: 4, borderWidth: 1 },
  sectionDone: { opacity: 0.75 },
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
});
