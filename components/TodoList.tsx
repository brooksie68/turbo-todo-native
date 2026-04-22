import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
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

  // ── Callbacks ────────────────────────────────��───────────────────────────

  const handleAddSubtask = useCallback((id: number) => {
    data.openAdd(id, 'bottom');
  }, [data.openAdd]);

  const handleModalSave = useCallback((task: string, note: string) => {
    data.setModalVisible(false);
    if (data.editingId !== null) {
      if (data.activeListId) data.updateTask(data.editingId, task, note, data.activeListId);
    } else {
      if (data.activeListId) {
        data.addTask(task, note, data.addParentId, data.insertPosition, data.activeListId);
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

  const handleClearAll = useCallback(() => {
    if (data.activeListId) data.handleClearAll(data.todos, data.activeListId);
  }, [data.todos, data.activeListId, data.handleClearAll]);

  const handleToggleAll = useCallback(() => {
    data.toggleAll(data.allExpanded);
  }, [data.allExpanded, data.toggleAll]);

  const handleDragBegin = useCallback((index: number) => {
    data.handleDragBegin(index, data.incompleteFlat);
  }, [data.handleDragBegin, data.incompleteFlat]);

  const handleDragEnd = useCallback(({ data: newFlat, from, to }: { data: FlatItem[]; from: number; to: number }) => {
    if (data.activeListId) data.handleDragEnd(newFlat, from, to, data.activeListId);
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
          imageCount={overlay.itemMenuImageCount}
          hasNote={!!(overlay.itemMenuTodo?.note)}
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
        />

        {/* Todo list */}
        {data.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={themeCtx.iconColor} />
          </View>
        ) : (
          <DraggableFlatList
            data={data.incompleteFlat}
            keyExtractor={item => String(item.todo.id)}
            containerStyle={[styles.scrollArea, { backgroundColor: themeCtx.surface, borderColor: themeCtx.listSelectorBorder }]}
            contentContainerStyle={styles.scrollContent}
            onDragBegin={handleDragBegin}
            onDragEnd={handleDragEnd}
            renderItem={renderItem}
            renderPlaceholder={() => (
              <View style={[styles.dropIndicator, { backgroundColor: themeCtx.accent }]} />
            )}
            ListHeaderComponent={data.incompleteFlat.length === 0 ? (
              <Text style={[styles.emptyState, { color: themeCtx.textSub }]}>No tasks yet.</Text>
            ) : null}
            ListFooterComponent={listFooter}
          />
        )}

        <TodoListToolbar
          onOpenMenu={() => overlay.setShowToolbarMenu(true)}
          onAddNew={() => data.openAdd(null, 'top')}
          onToggleAll={handleToggleAll}
          allExpanded={data.allExpanded}
        />

        <ImageViewer
          visible={viewerUri !== null}
          uri={viewerUri}
          onClose={() => setViewerUri(null)}
        />

        <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />

      </ThemeBg>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollArea: { flex: 1, borderWidth: 1, borderRadius: 2, marginHorizontal: 6 },
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
