import React, { useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  StyleSheet,
} from 'react-native';
import type { Todo } from '../lib/types';
import { IconOptions, IconClose, IconPin, IconBell } from './Icons';
import { deleteImage, type TaskImage } from '../lib/imageStore';
import { deleteLink, type TaskLink } from '../lib/linkStore';
import type { ButtonLayout } from './ItemOptionsMenu';
import { useTheme, useThemeContext } from '../lib/theme';

const INDENT_PX = 20;
const MAX_DEPTH = 3;

type Props = {
  todo: Todo;
  depth: number;
  isCollapsed?: boolean;
  onToggleCollapse: (id: number) => void;
  onToggleComplete: (id: number, current: boolean) => void;
  onOptions: (todo: Todo, depth: number, layout: ButtonLayout) => void;
  onAddSubtask: (parentId: number) => void;
  onShowAddMenu?: (todo: Todo, depth: number, layout: ButtonLayout) => void;
  images?: TaskImage[];
  links?: TaskLink[];
  onViewImage?: (uri: string) => void;
  onMediaChanged?: () => void;
  onDrag?: () => void;
  isBeingDragged?: boolean;
  positionLabel?: string;
  onDeleteNote?: (id: number) => void;
};

const TodoItem = memo(function TodoItem({
  todo,
  depth,
  isCollapsed = false,
  onToggleCollapse,
  onToggleComplete,
  onOptions,
  onAddSubtask,
  onShowAddMenu,
  images = [],
  links = [],
  onViewImage,
  onMediaChanged,
  onDrag,
  isBeingDragged,
  positionLabel: _positionLabel,
  onDeleteNote,
}: Props) {
  const theme = useTheme();
  const { fontSizes } = useThemeContext();
  const optionsBtnRef = useRef<View>(null);
  const addBtnRef = useRef<View>(null);

  const hasChildren = (todo.children?.length ?? 0) > 0;
  const canAddChild = depth < MAX_DEPTH - 1;
  const showMedia = depth <= 1;

  const handleDeleteImage = useCallback(async (id: string) => {
    await deleteImage(todo.id, id);
    onMediaChanged?.();
  }, [todo.id, onMediaChanged]);

  const handleDeleteLink = useCallback(async (id: number) => {
    await deleteLink(id);
    onMediaChanged?.();
  }, [onMediaChanged]);

  function getLabelColor() {
    if (todo.is_complete) return theme.textDone;
    if (todo.status === 'top-priority') return theme.priorityTop;
    if (todo.status === 'elevated') return theme.priorityElevated;
    return theme.textDepth[Math.min(depth, 2)];
  }

  const labelColor = getLabelColor();
  const fontSize = depth === 0 ? fontSizes.d0 : depth === 1 ? fontSizes.d1 : fontSizes.d2;
  const indentLeft = 12 + depth * INDENT_PX;

  return (
    <View style={isBeingDragged ? {
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.accent,
      borderRadius: 4,
      backgroundColor: theme.surface,
      zIndex: 999,
    } : undefined}>
      <TouchableOpacity
        style={[styles.row, { paddingLeft: indentLeft }]}
        activeOpacity={0.7}
        onPress={() => { if (hasChildren) onToggleCollapse(todo.id); }}
        onLongPress={todo.pinned || todo.is_complete ? undefined : onDrag}
        delayLongPress={300}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            { backgroundColor: theme.checkboxBg, borderColor: theme.border },
            todo.is_complete && { backgroundColor: theme.checkboxDone, borderColor: theme.checkboxDone },
          ]}
          onPress={() => onToggleComplete(todo.id, todo.is_complete)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {todo.is_complete && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Label + child count */}
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              { color: labelColor, fontSize },
              todo.is_complete && styles.labelDone,
            ]}
            numberOfLines={0}
          >
            {todo.task}
          </Text>
          {hasChildren && isCollapsed && (
            <Text style={[styles.childCount, { color: theme.textSub, marginLeft: 4 }]}>
              {'('}{todo.children!.length}{')'}
            </Text>
          )}
        </View>

        {todo.pinned && (
          <IconPin size={18} color={theme.accent} />
        )}
        {todo.alarm_time && (
          <IconBell size={14} color={theme.textSub} />
        )}

        {/* Row actions */}
        <View style={styles.rowActions}>
          {canAddChild && !todo.is_complete && (
            <View ref={addBtnRef} collapsable={false}>
              <TouchableOpacity
                onPress={() => {
                  addBtnRef.current?.measure((x, y, w, h, pageX, pageY) => {
                    onShowAddMenu?.(todo, depth, { pageX, pageY, width: w, height: h });
                  });
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.rowActionBtn}
              >
                <Text style={[styles.addPlus, { color: theme.iconColor }]}>+</Text>
              </TouchableOpacity>
            </View>
          )}
          <View ref={optionsBtnRef} collapsable={false}>
            <TouchableOpacity
              onPress={() => {
                optionsBtnRef.current?.measure((x, y, w, h, pageX, pageY) => {
                  onOptions(todo, depth, { pageX, pageY, width: w, height: h });
                });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.rowActionBtn}
            >
              <IconOptions size={20} color={theme.iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Note */}
      {todo.note ? (
        <View style={[styles.noteRow, { paddingLeft: indentLeft + 26 }]}>
          <Text
            style={[
              styles.note,
              { color: todo.is_complete ? theme.textDone : theme.textSub },
              todo.is_complete && styles.noteDone,
            ]}
            numberOfLines={0}
          >
            {todo.note}
          </Text>
          <TouchableOpacity
            onPress={() => onDeleteNote?.(todo.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.noteDeleteBtn}
          >
            <IconClose size={14} color={theme.textSub} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Image strip — depth 1 only */}
      {showMedia && !(depth === 0 && isCollapsed) && images.length > 0 && (
        <View style={[styles.imageStrip, { paddingLeft: indentLeft + 26 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll} contentContainerStyle={styles.imageScrollContent}>
            {images.map(img => (
              <View key={img.id} style={styles.thumbWrap}>
                <TouchableOpacity onPress={() => onViewImage?.(img.localPath)}>
                  <Image source={{ uri: img.localPath }} style={[styles.thumb, { backgroundColor: theme.border }]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.thumbDelete, { backgroundColor: theme.iconColor }]}
                  onPress={() => handleDeleteImage(img.id)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <IconClose size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Link strip — depth 1 only */}
      {showMedia && !(depth === 0 && isCollapsed) && links.length > 0 && (
        <View style={[styles.linkStrip, { paddingLeft: indentLeft + 26 }]}>
          {links.map(link => (
            <View key={link.id} style={styles.linkRow}>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => Linking.openURL(link.url)}
              >
                <Text style={[styles.linkText, { color: theme.iconColor }]} numberOfLines={1}>
                  {link.name || link.url}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteLink(link.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconClose size={14} color={theme.iconColor} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Row separator */}
      <View style={[styles.separator, { marginLeft: indentLeft, backgroundColor: theme.separator }]} />
    </View>
  );
});

export default TodoItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingRight: 12,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '400',
  },
  labelDone: {
    textDecorationLine: 'line-through',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
  },
  rowActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 2,
  },
  childCount: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 12,
    paddingBottom: 4,
  },
  note: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  noteDone: {
    textDecorationLine: 'line-through',
  },
  noteDeleteBtn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
    flexShrink: 0,
  },
  imageStrip: {
    paddingBottom: 6,
    paddingRight: 12,
  },
  imageScroll: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  imageScrollContent: {
    paddingTop: 5,
    paddingRight: 5,
  },
  thumbWrap: {
    marginRight: 6,
    position: 'relative',
    overflow: 'visible',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 3,
  },
  thumbDelete: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkStrip: {
    paddingBottom: 6,
    paddingRight: 12,
    gap: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkBtn: {
    flex: 1,
  },
  linkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  separator: {
    height: 1,
  },
});
