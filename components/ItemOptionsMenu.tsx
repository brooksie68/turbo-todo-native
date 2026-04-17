import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Todo } from '../lib/types';

type Props = {
  visible: boolean;
  todo: Todo | null;
  depth: number;
  onClose: () => void;
  onEdit: () => void;
  onAddSubtask: () => void;
  onDelete: () => void;
  onSetStatus: (status: string | null) => void;
  onAddImage?: () => void;
  onAddUrl?: () => void;
  imageCount?: number;
};

export default function ItemOptionsMenu({
  visible,
  todo,
  depth,
  onClose,
  onEdit,
  onAddSubtask,
  onDelete,
  onSetStatus,
  onAddImage,
  onAddUrl,
  imageCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const canAddChild = depth < 2;

  if (!todo) return null;

  function handle(fn: () => void) {
    fn();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        {/* Task name label */}
        <Text style={styles.taskLabel} numberOfLines={2}>{todo.task}</Text>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={() => handle(onEdit)}>
          <Text style={styles.itemText}>Edit</Text>
        </TouchableOpacity>

        {canAddChild && !todo.is_complete && (
          <TouchableOpacity style={styles.item} onPress={() => handle(onAddSubtask)}>
            <Text style={styles.itemText}>Add subtask</Text>
          </TouchableOpacity>
        )}

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

        <View style={styles.divider} />

        {/* Priority row */}
        <Text style={styles.sectionLabel}>Priority:</Text>
        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={[styles.priorityBtn, todo.status === null && styles.priorityBtnActive]}
            onPress={() => handle(() => onSetStatus(null))}
          >
            <Text style={[styles.priorityBtnText, todo.status === null && styles.priorityBtnTextActive]}>
              None
            </Text>
          </TouchableOpacity>
          <Text style={styles.priorityPipe}>|</Text>
          <TouchableOpacity
            style={[styles.priorityBtn, todo.status === 'elevated' && styles.priorityBtnActive]}
            onPress={() => handle(() => onSetStatus('elevated'))}
          >
            <Text style={[styles.priorityBtnText, todo.status === 'elevated' && styles.priorityElevatedText]}>
              Elevated
            </Text>
          </TouchableOpacity>
          <Text style={styles.priorityPipe}>|</Text>
          <TouchableOpacity
            style={[styles.priorityBtn, todo.status === 'top-priority' && styles.priorityBtnActive]}
            onPress={() => handle(() => onSetStatus('top-priority'))}
          >
            <Text style={[styles.priorityBtnText, todo.status === 'top-priority' && styles.priorityTopText]}>
              Top
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={() => handle(onDelete)}>
          <Text style={[styles.itemText, styles.dangerText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#e6dac8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#c7ba9b',
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  taskLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6a3f1f',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6a3f1f',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  priorityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 4,
  },
  priorityBtnActive: {
    backgroundColor: '#E2D4AD',
  },
  priorityBtnText: {
    fontSize: 16,
    color: '#1a2a38',
  },
  priorityBtnTextActive: {
    fontWeight: '600',
  },
  priorityElevatedText: {
    color: '#c96a00',
    fontWeight: '600',
  },
  priorityTopText: {
    color: '#b52a1a',
    fontWeight: '600',
  },
  priorityPipe: {
    fontSize: 16,
    color: '#6a3f1f',
    flexShrink: 0,
  },
});
