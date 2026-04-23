import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext, TEXT_SIZE_COUNT } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onSort: (by: 'status' | 'date' | 'alpha') => void;
};

export default function ToolbarOptionsMenu({
  visible,
  onClose,
  onBackup,
  onRestore,
  onClearCompleted,
  onClearAll,
  onSort,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme, textSizeIndex, setTextSizeIndex } = useThemeContext();
  const [confirmAction, setConfirmAction] = useState<'clear' | 'restore' | null>(null);

  function handleClose() {
    setConfirmAction(null);
    onClose();
  }

  function handleClearCompleted() { onClearCompleted(); handleClose(); }
  function handleClearAll() { setConfirmAction(null); onClearAll(); handleClose(); }
  function handleBackup() { onBackup(); handleClose(); }
  function handleRestore() { setConfirmAction(null); onRestore(); handleClose(); }

  const t = theme;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />
      <View style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border, paddingBottom: insets.bottom + 8 }]}>
        {confirmAction === 'clear' ? (
          <View style={styles.confirmBox}>
            <Text style={[styles.confirmMsg, { color: t.accent }]}>This cannot be undone</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: t.border }]}
                onPress={() => setConfirmAction(null)}
              >
                <Text style={[styles.confirmBtnText, { color: t.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: t.danger }]}
                onPress={handleClearAll}
              >
                <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : confirmAction === 'restore' ? (
          <View style={styles.confirmBox}>
            <Text style={[styles.confirmMsg, { color: t.accent }]}>This will replace all your current data. This cannot be undone.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: t.border }]}
                onPress={() => setConfirmAction(null)}
              >
                <Text style={[styles.confirmBtnText, { color: t.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: t.danger }]}
                onPress={handleRestore}
              >
                <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Restore</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.splitRow}>
              <TouchableOpacity style={styles.splitBtn} onPress={handleBackup}>
                <Text style={[styles.splitBtnText, { color: t.text }]}>Back up</Text>
              </TouchableOpacity>
              <View style={[styles.splitDivider, { backgroundColor: t.border }]} />
              <TouchableOpacity style={styles.splitBtn} onPress={() => setConfirmAction('restore')}>
                <Text style={[styles.splitBtnText, { color: t.text }]}>Restore</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            <Text style={[styles.sectionLabel, { color: t.accent }]}>Sort by:</Text>
            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.sortBtn} onPress={() => { onSort('status'); handleClose(); }}>
                <Text style={[styles.sortBtnText, { color: t.text }]}>Status</Text>
              </TouchableOpacity>
              <Text style={[styles.sortPipe, { color: t.accent }]}>|</Text>
              <TouchableOpacity style={styles.sortBtn} onPress={() => { onSort('date'); handleClose(); }}>
                <Text style={[styles.sortBtnText, { color: t.text }]}>Date</Text>
              </TouchableOpacity>
              <Text style={[styles.sortPipe, { color: t.accent }]}>|</Text>
              <TouchableOpacity style={styles.sortBtn} onPress={() => { onSort('alpha'); handleClose(); }}>
                <Text style={[styles.sortBtnText, { color: t.text }]}>Alpha</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            <View style={styles.textSizeRow}>
              <TouchableOpacity
                style={styles.textSizeBtn}
                onPress={() => setTextSizeIndex(textSizeIndex + 1)}
                disabled={textSizeIndex >= TEXT_SIZE_COUNT - 1}
              >
                <Text style={[styles.textSizeBtnText, { color: textSizeIndex >= TEXT_SIZE_COUNT - 1 ? t.border : t.text }]}>+</Text>
              </TouchableOpacity>
              <Text style={[styles.textSizeLabel, { color: t.text }]}>Text size</Text>
              <TouchableOpacity
                style={styles.textSizeBtn}
                onPress={() => setTextSizeIndex(textSizeIndex - 1)}
                disabled={textSizeIndex <= 0}
              >
                <Text style={[styles.textSizeBtnText, { color: textSizeIndex <= 0 ? t.border : t.text }]}>−</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            <TouchableOpacity style={styles.item} onPress={handleClearCompleted}>
              <Text style={[styles.itemText, { color: t.text }]}>Clear all completed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => setConfirmAction('clear')}>
              <Text style={[styles.itemText, { color: t.danger }]}>Clear entire list</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  sortBtnText: { fontSize: 16 },
  sortPipe: { fontSize: 16, flexShrink: 0 },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  splitBtnText: { fontSize: 16 },
  splitDivider: {
    width: 1,
    height: 20,
  },
  confirmBox: {
    padding: 12,
    gap: 8,
  },
  confirmMsg: { fontSize: 15 },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmBtn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmBtnText: { fontSize: 15 },
  textSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  textSizeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  textSizeBtnText: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
  },
  textSizeLabel: {
    flex: 2,
    textAlign: 'center',
    fontSize: 16,
  },
});
