import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import type { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import type { FlatItem } from '../hooks/useTodoData';
import { useTodoData } from '../hooks/useTodoData';
import { useOverlayState } from '../hooks/useOverlayState';
import TodoItem from './TodoItem';
import AddEditModal from './AddEditModal';
import AddLinkModal from './AddLinkModal';
import ToolbarOptionsMenu from './ToolbarOptionsMenu';
import ItemOptionsMenu from './ItemOptionsMenu';
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

export default function TodoList() {
  const insets = useSafeAreaInsets();
  const { theme, themeId, setThemeId } = useThemeContext();

  const data = useTodoData();
  const overlay = useOverlayState(data);

  // Header-only state — doesn't affect list rendering
  const [showListPicker, setShowListPicker] = useState(false);
  const [themePickerLayout, setThemePickerLayout] = useState<{ top: number; left: number } | null>(null);
  const logoBtnRef = useRef<View>(null);

  // ── Stable callbacks for TodoItem props ──────────────────────────────────

  const handleAddSubtask = useCallback((id: number) => {
    data.openAdd(id, 'bottom');
  }, [data.openAdd]);

  const handleModalSave = useCallback((task: string, note: string) => {
    data.setModalVisible(false);
    if (data.editingId !== null) {
      if (data.activeListId) data.updateTask(data.editingId, task, note, data.activeListId);
    } else {
      if (data.activeListId && data.userId) {
        data.addTask(task, note, data.addParentId, data.insertPosition, data.activeListId, data.userId);
      }
    }
  }, [data]);

  const handleSync = useCallback(() => {
    if (data.activeListId) data.fetchTodos(data.activeListId, false);
  }, [data.activeListId, data.fetchTodos]);

  const handleSort = useCallback((criterion: string) => {
    if (data.activeListId) data.handleSort(criterion, data.activeListId);
  }, [data.activeListId, data.handleSort]);

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

  // ── renderItem — memoized, stable prop references let React.memo work ───

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<FlatItem>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item.todo}
        depth={item.depth}
        onToggleCollapse={data.toggleCollapse}
        onToggleComplete={data.toggleComplete}
        onOptions={overlay.handleOptions}
        onAddSubtask={handleAddSubtask}
        imageRefreshToken={overlay.imageTokens[item.todo.id] ?? 0}
        linkRefreshToken={overlay.linkTokens[item.todo.id] ?? 0}
        onDrag={drag}
        isBeingDragged={isActive}
      />
    </ScaleDecorator>
  ), [
    data.toggleCollapse,
    data.toggleComplete,
    overlay.handleOptions,
    handleAddSubtask,
    overlay.imageTokens,
    overlay.linkTokens,
  ]);

  // ── Completed section renderer ───────────────────────────────────────────

  const renderCompletedItem = useCallback(({ item }: { item: FlatItem }) => (
    <TodoItem
      todo={item.todo}
      depth={item.depth}
      onToggleCollapse={data.toggleCollapse}
      onToggleComplete={data.toggleComplete}
      onOptions={overlay.handleOptions}
      onAddSubtask={handleAddSubtask}
    />
  ), [
    data.toggleCollapse,
    data.toggleComplete,
    overlay.handleOptions,
    handleAddSubtask,
  ]);

  const completedHeader = data.completeFlat.length > 0 ? (
    <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }, styles.sectionDone]}>
      <Text style={[styles.sectionLabel, { color: theme.accent }]}>Completed</Text>
    </View>
  ) : null;

  const listFooter = data.completeFlat.length > 0 ? (
    <FlatList
      data={data.completeFlat}
      keyExtractor={item => String(item.todo.id)}
      renderItem={renderCompletedItem}
      scrollEnabled={false}
      style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }, styles.sectionDone]}
      ListHeaderComponent={<Text style={[styles.sectionLabel, { color: theme.accent }]}>Completed</Text>}
    />
  ) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <LinearGradient
        colors={(theme.gradientColors ?? [theme.bg, theme.bg]) as [string, string, ...string[]]}
        locations={(theme.gradientLocations ?? undefined) as [number, number, ...number[]] | undefined}
        style={styles.container}
      >

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
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

          <TouchableOpacity
            style={[styles.listSelector, { backgroundColor: theme.listSelectorBg, borderBottomColor: theme.listSelectorBorder }]}
            onPress={() => setShowListPicker(true)}
          >
            <Text style={[styles.listSelectorText, { color: theme.listSelectorText }]} numberOfLines={1}>
              {data.activeList?.name ?? '…'}
            </Text>
            <Text style={[styles.listSelectorArrow, { color: theme.listSelectorText }]}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gearBtn}>
            <IconSettings size={24} color={theme.iconColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpBtn}>
            <IconHelp size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        {/* List picker */}
        <Modal visible={showListPicker} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowListPicker(false)}
          >
            <View style={[styles.listPickerDropdown, { backgroundColor: theme.listSelectorBg, borderColor: theme.border }]}>
              {data.lists.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.listPickerItem, { borderBottomColor: theme.border }, l.id === data.activeListId && { backgroundColor: theme.surface }]}
                  onPress={() => { data.switchToList(l.id); setShowListPicker(false); }}
                >
                  <Text style={[styles.listPickerText, { color: theme.listSelectorText }, l.id === data.activeListId && styles.listPickerTextActive]}>
                    {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Theme picker */}
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
          visible={data.modalVisible}
          title={data.modalTitle}
          initialTask={data.modalInitialTask}
          initialNote={data.modalInitialNote}
          onClose={() => data.setModalVisible(false)}
          onSave={handleModalSave}
        />

        {/* Toolbar options menu */}
        <ToolbarOptionsMenu
          visible={overlay.showToolbarMenu}
          onClose={() => overlay.setShowToolbarMenu(false)}
          onSync={handleSync}
          onSort={handleSort}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
          onSignOut={() => supabase.auth.signOut()}
        />

        {/* Item options menu */}
        <ItemOptionsMenu
          visible={overlay.itemMenuTodo !== null}
          todo={overlay.itemMenuTodo}
          depth={overlay.itemMenuDepth}
          buttonLayout={overlay.itemMenuLayout}
          onClose={overlay.closeItemMenu}
          onEdit={overlay.handleMenuEdit}
          onDelete={overlay.handleItemDelete}
          onSetStatus={overlay.handleMenuSetStatus}
          onAddImage={overlay.handleMenuAddImage}
          onAddUrl={overlay.handleMenuAddUrl}
          onEditNote={overlay.handleEditNote}
          onDeleteNote={overlay.handleDeleteNote}
          onExportForAI={overlay.handleExportForAI}
          imageCount={overlay.itemMenuImageCount}
          hasNote={!!(overlay.itemMenuTodo?.note)}
        />

        {/* Note modal */}
        <AddEditModal
          visible={overlay.noteModalVisible}
          title={overlay.noteEditingTodo?.note ? 'Edit note' : 'Add note'}
          initialTask=""
          initialNote={overlay.noteEditingTodo?.note ?? ''}
          noteMode
          onClose={() => { overlay.setNoteModalVisible(false); overlay.setNoteEditingTodo(null); }}
          onSave={overlay.handleSaveNote}
        />

        {/* Link modal */}
        <AddLinkModal
          visible={overlay.showLinkModal}
          onClose={() => { overlay.setShowLinkModal(false); overlay.setLinkTargetTodo(null); }}
          onSave={overlay.handleSaveLink}
        />

        {/* ── Todo list ── */}
        {data.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.iconColor} />
          </View>
        ) : (
          <DraggableFlatList
            data={data.incompleteFlat}
            keyExtractor={item => String(item.todo.id)}
            containerStyle={[styles.scrollArea, { backgroundColor: theme.surface }]}
            contentContainerStyle={styles.scrollContent}
            onDragBegin={handleDragBegin}
            onDragEnd={handleDragEnd}
            renderItem={renderItem}
            renderPlaceholder={() => (
              <View style={[styles.dropIndicator, { backgroundColor: theme.accent }]} />
            )}
            ListHeaderComponent={data.incompleteFlat.length === 0 ? (
              <Text style={[styles.emptyState, { color: theme.textSub }]}>No tasks yet.</Text>
            ) : null}
            ListFooterComponent={listFooter}
          />
        )}

        {/* ── Bottom toolbar ── */}
        <View style={[styles.toolbarOuter, { backgroundColor: theme.headerBg, borderTopColor: theme.headerBorder, paddingBottom: insets.bottom }]}>
          <View style={styles.toolbarInner}>
            <TouchableOpacity style={styles.toolbarLeft} onPress={() => overlay.setShowToolbarMenu(true)}>
              <IconOptions size={24} color={theme.iconColor} />
            </TouchableOpacity>

            <View style={styles.toolbarCenter}>
              <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => data.openAdd(null, 'bottom')}>
                <IconAddBottom size={18} color={theme.iconColor} />
              </TouchableOpacity>
              <Text style={[styles.newLabel, { color: theme.iconColor }]}>new</Text>
              <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => data.openAdd(null, 'top')}>
                <IconAddTop size={18} color={theme.iconColor} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.toolbarRight} onPress={handleToggleAll}>
              {data.allExpanded
                ? <IconExpandUp size={24} color={theme.iconColor} />
                : <IconExpandDown size={24} color={theme.iconColor} />
              }
            </TouchableOpacity>
          </View>
        </View>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header — absolute layout, 64px tall, Figma coords
  header: {
    height: 64,
  },
  logoBtn: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSelector: {
    position: 'absolute',
    left: 60,
    top: 15,
    width: 189,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    gap: 6,
  },
  listSelectorText: { flex: 1, fontSize: 15 },
  listSelectorArrow: { fontSize: 10 },
  gearBtn: {
    position: 'absolute',
    left: 260,
    top: 20,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtn: {
    position: 'absolute',
    right: 21,
    top: 20,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  themeItem: { paddingVertical: 11, paddingHorizontal: 12 },
  themeItemText: { fontSize: 16 },
  themeItemActive: { fontWeight: '600' },

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
  listPickerText: { fontSize: 15 },
  listPickerTextActive: { fontWeight: '600' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  section: {
    margin: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
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

  // Toolbar — absolute layout, 42px tall, Figma coords
  toolbarOuter: { borderTopWidth: 1 },
  toolbarInner: { height: 42 },
  toolbarLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: 0,
  },
  toolbarCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolbarIconBtn: { padding: 4 },
  newLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  toolbarRight: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 58,
    height: 30,
    paddingRight: 22,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
