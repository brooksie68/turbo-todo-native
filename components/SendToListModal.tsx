import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../lib/theme';
import type { List } from '../lib/types';

type Props = {
  visible: boolean;
  lists: List[];
  activeListId: number | null;
  dailyListId: number | null;
  onSelect: (listId: number) => void;
  onClose: () => void;
};

export default function SendToListModal({
  visible,
  lists,
  activeListId,
  dailyListId,
  onSelect,
  onClose,
}: Props) {
  const theme = useTheme();
  const eligible = lists.filter(l => l.id !== activeListId && l.id !== dailyListId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.accent }]}>Send to list</Text>
        {eligible.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSub }]}>No other lists available.</Text>
        ) : (
          <ScrollView bounces={false}>
            {eligible.map((l, i) => (
              <TouchableOpacity
                key={l.id}
                style={[
                  styles.item,
                  i < eligible.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
                onPress={() => onSelect(l.id)}
              >
                <Text style={[styles.itemText, { color: theme.text }]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity
          style={[styles.cancelRow, { borderTopColor: theme.border }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: theme.textSub }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: '30%',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 320,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  itemText: { fontSize: 16 },
  empty: {
    fontSize: 15,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelRow: {
    borderTopWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15 },
});
