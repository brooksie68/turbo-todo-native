import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSync: () => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onSignOut: () => void;
  onSort: (by: 'status' | 'date' | 'alpha') => void;
};

export default function ToolbarOptionsMenu({
  visible,
  onClose,
  onSync,
  onClearCompleted,
  onClearAll,
  onSignOut,
  onSort,
}: Props) {
  const insets = useSafeAreaInsets();
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClose() {
    setConfirmClear(false);
    onClose();
  }

  function handleSync() { onSync(); handleClose(); }
  function handleClearCompleted() { onClearCompleted(); handleClose(); }
  function handleClearAll() { setConfirmClear(false); onClearAll(); handleClose(); }
  function handleSignOut() { onSignOut(); handleClose(); }

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
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        {confirmClear ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmMsg}>This cannot be undone</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmClear(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmClearBtn}
                onPress={handleClearAll}
              >
                <Text style={styles.confirmClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.item} onPress={handleSync}>
              <Text style={styles.itemText}>Sync</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Sort by */}
            <Text style={styles.sectionLabel}>Sort by:</Text>
            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.sortBtn} onPress={() => { onSort('status'); handleClose(); }}>
                <Text style={styles.sortBtnText}>Status</Text>
              </TouchableOpacity>
              <Text style={styles.sortPipe}>|</Text>
              <TouchableOpacity style={styles.sortBtn} onPress={() => { onSort('date'); handleClose(); }}>
                <Text style={styles.sortBtnText}>Date</Text>
              </TouchableOpacity>
              <Text style={styles.sortPipe}>|</Text>
              <TouchableOpacity style={styles.sortBtn} onPress={() => { onSort('alpha'); handleClose(); }}>
                <Text style={styles.sortBtnText}>Alpha</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.item} onPress={handleClearCompleted}>
              <Text style={styles.itemText}>Clear all completed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => setConfirmClear(true)}>
              <Text style={styles.itemText}>Clear entire list</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.item} onPress={handleSignOut}>
              <Text style={styles.itemText}>Sign out</Text>
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
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#1a2a38',
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
  sortBtnText: {
    fontSize: 16,
    color: '#1a2a38',
  },
  sortPipe: {
    fontSize: 16,
    color: '#6a3f1f',
    flexShrink: 0,
  },
  confirmBox: {
    padding: 12,
    gap: 8,
  },
  confirmMsg: {
    fontSize: 15,
    color: '#6a3f1f',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmCancelBtn: {
    backgroundColor: '#E2D4AD',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmCancelText: {
    fontSize: 15,
    color: '#1a2a38',
  },
  confirmClearBtn: {
    backgroundColor: '#9e3a2a',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmClearText: {
    fontSize: 15,
    color: '#fff',
  },
});
