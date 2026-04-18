import { useState, useEffect, useCallback, useRef } from 'react';
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
import { IconOptions, IconAddBottom, IconClose } from './Icons';
import { getImages, deleteImage, type TaskImage } from '../lib/imageStore';
import { getLinks, deleteLink, type TaskLink } from '../lib/linkStore';
import ImageViewer from './ImageViewer';
import type { ButtonLayout } from './ItemOptionsMenu';
import { useTheme } from '../lib/theme';

const INDENT_PX = 20;
const MAX_DEPTH = 3;

type Props = {
  todo: Todo;
  depth: number;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onToggleComplete: (id: number, current: boolean) => void;
  onOptions: (todo: Todo, depth: number, layout: ButtonLayout) => void;
  onAddSubtask: (parentId: number) => void;
  imageRefreshToken?: number;
  linkRefreshToken?: number;
};

export default function TodoItem({
  todo,
  depth,
  collapsedIds,
  onToggleCollapse,
  onToggleComplete,
  onOptions,
  onAddSubtask,
  imageRefreshToken,
  linkRefreshToken,
}: Props) {
  const theme = useTheme();
  const optionsBtnRef = useRef<View>(null);

  const hasChildren = (todo.children?.length ?? 0) > 0;
  const isCollapsed = collapsedIds.has(todo.id);
  const visibleChildren = todo.children ?? [];
  const canAddChild = depth < MAX_DEPTH - 1;
  const showMedia = depth === 1;

  const [images, setImages] = useState<TaskImage[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!showMedia) return;
    setImages(await getImages(todo.id));
  }, [todo.id, showMedia]);

  const loadLinks = useCallback(async () => {
    if (!showMedia) return;
    setLinks(await getLinks(todo.id));
  }, [todo.id, showMedia]);

  useEffect(() => { loadImages(); }, [loadImages, imageRefreshToken]);
  useEffect(() => { loadLinks(); }, [loadLinks, linkRefreshToken]);

  async function handleDeleteImage(id: string) {
    setImages(await deleteImage(todo.id, id));
  }

  async function handleDeleteLink(id: number) {
    await deleteLink(id);
    loadLinks();
  }

  function getLabelColor() {
    if (todo.is_complete) return theme.textDone;
    if (todo.status === 'top-priority') return theme.priorityTop;
    if (todo.status === 'elevated') return theme.priorityElevated;
    return theme.textDepth[Math.min(depth, 2)];
  }

  const labelColor = getLabelColor();
  const fontSize = depth === 0 ? 16 : depth === 1 ? 15 : 14;
  const indentLeft = 12 + depth * INDENT_PX;

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, { paddingLeft: indentLeft }]}
        activeOpacity={0.7}
        onPress={() => { if (hasChildren) onToggleCollapse(todo.id); }}
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

        {/* Label */}
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

        {/* Row actions */}
        <View style={styles.rowActions}>
          {canAddChild && !todo.is_complete && (
            <TouchableOpacity
              onPress={() => onAddSubtask(todo.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.rowActionBtn}
            >
              <IconAddBottom size={16} color={theme.iconColor} />
            </TouchableOpacity>
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
              <IconOptions size={16} color={theme.iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Note */}
      {todo.note ? (
        <Text style={[styles.note, { paddingLeft: indentLeft + 26, color: theme.textSub }]}>
          {todo.note}
        </Text>
      ) : null}

      {/* Image strip — depth 1 only */}
      {showMedia && images.length > 0 && (
        <View style={[styles.imageStrip, { paddingLeft: indentLeft + 26 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map(img => (
              <View key={img.id} style={styles.thumbWrap}>
                <TouchableOpacity onPress={() => setViewerUri(img.localPath)}>
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
      {showMedia && links.length > 0 && (
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

      {/* Full-screen image viewer */}
      <ImageViewer
        visible={viewerUri !== null}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />

      {/* Children */}
      {hasChildren && !isCollapsed && depth < MAX_DEPTH - 1 && (
        <View>
          {visibleChildren
            .slice()
            .sort((a, b) => {
              if (a.is_complete !== b.is_complete) return a.is_complete ? 1 : -1;
              return 0;
            })
            .map(child => (
              <TodoItem
                key={child.id}
                todo={child}
                depth={depth + 1}
                collapsedIds={collapsedIds}
                onToggleCollapse={onToggleCollapse}
                onToggleComplete={onToggleComplete}
                onOptions={onOptions}
                onAddSubtask={onAddSubtask}
              />
            ))}
        </View>
      )}

      {/* Row separator */}
      <View style={[styles.separator, { marginLeft: indentLeft, backgroundColor: theme.separator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 3,
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
  label: {
    flex: 1,
    fontWeight: '400',
  },
  labelDone: {
    textDecorationLine: 'line-through',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  rowActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    fontSize: 12,
    paddingBottom: 4,
    paddingRight: 12,
    fontStyle: 'italic',
  },
  imageStrip: {
    paddingBottom: 6,
    paddingRight: 12,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  thumbWrap: {
    marginRight: 6,
    position: 'relative',
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
