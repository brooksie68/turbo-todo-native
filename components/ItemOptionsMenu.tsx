import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import type { Todo } from '../lib/types';
import { IconBolt, IconPriorityHigh } from './Icons';

export type ButtonLayout = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  todo: Todo | null;
  depth: number;
  buttonLayout: ButtonLayout | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetStatus: (status: string | null) => void;
  onAddImage?: () => void;
  onAddUrl?: () => void;
  onEditNote: () => void;
  onDeleteNote: () => void;
  onExportForAI: () => void;
  imageCount?: number;
  hasNote: boolean;
};

export default function ItemOptionsMenu({
  visible,
  todo,
  depth,
  buttonLayout,
  onClose,
  onEdit,
  onDelete,
  onSetStatus,
  onAddImage,
  onAddUrl,
  onEditNote,
  onDeleteNote,
  onExportForAI,
  imageCount = 0,
  hasNote,
}: Props) {
  if (!todo) return null;

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const layout = buttonLayout ?? { pageX: 0, pageY: 0, width: 0, height: 0 };
  const spaceBelow = screenH - (layout.pageY + layout.height);
  const flipAbove = spaceBelow < 300;

  const right = Math.max(4, screenW - (layout.pageX + layout.width));
  const top = layout.pageY + layout.height + 4;
  const bottom = screenH - layout.pageY + 4;

  function handle(fn: () => void) {
    fn();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[
        styles.dropdown,
        flipAbove ? { bottom, right } : { top, right },
      ]}>
        {/* Priority row */}
        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={styles.priorityBtn}
            onPress={() => handle(() => onSetStatus(todo.status === 'elevated' ? null : 'elevated'))}
          >
            <IconBolt size={20} color={todo.status === 'elevated' ? '#c96a00' : '#aaa'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priorityBtn}
            onPress={() => handle(() => onSetStatus(todo.status === 'top-priority' ? null : 'top-priority'))}
          >
            <IconPriorityHigh size={20} color={todo.status === 'top-priority' ? '#b52a1a' : '#aaa'} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={() => handle(onEdit)}>
          <Text style={styles.itemText}>Edit</Text>
        </TouchableOpacity>

        {depth === 1 && onAddImage && imageCount < 5 && (
          <TouchableOpacity style={styles.item} onPress={() => handle(onAddImage)}>
            <Text style={styles.itemText}>Add image</Text>
          </TouchableOpacity>
        )}

        {depth === 1 && onAddUrl && (
          <TouchableOpacity style={styles.item} onPress={() => handle(onAddUrl)}>
            <Text style={styles.itemText}>Add URL</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.item} onPress={() => handle(onEditNote)}>
          <Text style={styles.itemText}>{hasNote ? 'Edit note' : 'Add note'}</Text>
        </TouchableOpacity>

        {hasNote && (
          <TouchableOpacity style={styles.item} onPress={() => handle(onDeleteNote)}>
            <Text style={[styles.itemText, styles.dangerText]}>Delete note</Text>
          </TouchableOpacity>
        )}

        {depth <= 1 && (
          <TouchableOpacity style={styles.item} onPress={() => handle(onExportForAI)}>
            <Text style={styles.itemText}>Export for AI</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={() => handle(onDelete)}>
          <Text style={[styles.itemText, styles.dangerText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    backgroundColor: '#e6dac8',
    borderWidth: 1,
    borderColor: '#c7ba9b',
    borderRadius: 4,
    minWidth: 220,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  priorityBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 4,
  },
  item: {
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#1a2a38',
  },
  dangerText: {
    color: '#9e3a2a',
  },
  divider: {
    height: 1,
    backgroundColor: '#c7ba9b',
    marginVertical: 2,
  },
});
