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
import { useTheme } from '../lib/theme';

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
  onPin: () => void;
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
  onPin,
  onAddImage,
  onAddUrl,
  onEditNote,
  onDeleteNote,
  onExportForAI,
  imageCount = 0,
  hasNote,
}: Props) {
  const theme = useTheme();

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
        { backgroundColor: theme.surface, borderColor: theme.border },
        flipAbove ? { bottom, right } : { top, right },
      ]}>
        {/* Priority row — always shown */}
        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={styles.priorityBtn}
            onPress={() => handle(() => onSetStatus(todo.status === 'elevated' ? null : 'elevated'))}
          >
            <IconBolt size={20} color={todo.status === 'elevated' ? theme.priorityElevated : theme.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priorityBtn}
            onPress={() => handle(() => onSetStatus(todo.status === 'top-priority' ? null : 'top-priority'))}
          >
            <IconPriorityHigh size={20} color={todo.status === 'top-priority' ? theme.priorityTop : theme.textSub} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {depth === 0 ? (
          <>
            <TouchableOpacity style={styles.item} onPress={() => handle(onPin)}>
              <Text style={[styles.itemText, { color: theme.text }]}>
                {todo.pinned ? 'Unpin item' : 'Pin to top'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => handle(onExportForAI)}>
              <Text style={[styles.itemText, { color: theme.text }]}>Export for AI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => handle(onEdit)}>
              <Text style={[styles.itemText, { color: theme.text }]}>Edit</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.item} onPress={() => handle(onDelete)}>
              <Text style={[styles.itemText, { color: theme.danger }]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {depth === 1 && (
              <TouchableOpacity style={styles.item} onPress={() => handle(onExportForAI)}>
                <Text style={[styles.itemText, { color: theme.text }]}>Export for AI</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.item} onPress={() => handle(onEdit)}>
              <Text style={[styles.itemText, { color: theme.text }]}>Edit</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.item} onPress={() => handle(onDelete)}>
              <Text style={[styles.itemText, { color: theme.danger }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
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
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
});
