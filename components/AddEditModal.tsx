import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  initialTask?: string;
  initialNote?: string;
  onClose: () => void;
  onSave: (task: string, note: string) => void;
};

export default function AddEditModal({
  visible,
  title,
  initialTask = '',
  initialNote = '',
  onClose,
  onSave,
}: Props) {
  const [task, setTask] = useState(initialTask);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (visible) {
      setTask(initialTask);
      setNote(initialNote);
    }
  }, [visible, initialTask, initialNote]);

  function handleSave() {
    const trimmed = task.trim();
    if (!trimmed) return;
    onSave(trimmed, note.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <TextInput
            style={styles.input}
            placeholder="Task"
            placeholderTextColor="#aaa"
            value={task}
            onChangeText={setTask}
            autoFocus
            returnKeyType="next"
            maxLength={500}
          />

          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Note (optional)"
            placeholderTextColor="#aaa"
            value={note}
            onChangeText={setNote}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            maxLength={200}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !task.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!task.trim()}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#e6dac8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00395b',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fffdf5',
    borderWidth: 1,
    borderColor: '#c7ba9b',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a2a38',
  },
  noteInput: {
    fontSize: 14,
    color: '#555',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 15,
    color: '#6a3f1f',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#025f96',
    borderRadius: 4,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
