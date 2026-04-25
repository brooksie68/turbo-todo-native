import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../lib/theme';
import type { ButtonLayout } from './ItemOptionsMenu';

type Props = {
  visible: boolean;
  buttonLayout: ButtonLayout | null;
  onClose: () => void;
  onAddSubtask: () => void;
  onAddImage: () => void;
  onAddUrl: () => void;
  onAddNote: () => void;
  hideSubtask?: boolean;
};

export default function AddChildMenu({
  visible,
  buttonLayout,
  onClose,
  onAddSubtask,
  onAddImage,
  onAddUrl,
  onAddNote,
  hideSubtask = false,
}: Props) {
  const theme = useTheme();

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const layout = buttonLayout ?? { pageX: 0, pageY: 0, width: 0, height: 0 };
  const spaceBelow = screenH - (layout.pageY + layout.height);
  const flipAbove = spaceBelow < 200;

  const right = Math.max(4, screenW - (layout.pageX + layout.width));
  const top = layout.pageY + layout.height + 4;
  const bottom = screenH - layout.pageY + 4;

  function handle(fn: () => void) {
    fn();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[
        styles.dropdown,
        { backgroundColor: theme.surface, borderColor: theme.border },
        flipAbove ? { bottom, right } : { top, right },
      ]}>
        {!hideSubtask && (
          <TouchableOpacity style={styles.item} onPress={() => handle(onAddSubtask)}>
            <Text style={[styles.itemText, { color: theme.text }]}>Subtask</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.item} onPress={() => handle(onAddImage)}>
          <Text style={[styles.itemText, { color: theme.text }]}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => handle(onAddUrl)}>
          <Text style={[styles.itemText, { color: theme.text }]}>URL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => handle(onAddNote)}>
          <Text style={[styles.itemText, { color: theme.text }]}>Note</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dropdown: {
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
  header: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  item: {
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 16,
  },
});
