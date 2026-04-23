import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';

type Props = {
  visible: boolean;
  title: string;
  initialTask?: string;
  initialNote?: string;
  noteMode?: boolean;
  onClose: () => void;
  onSave: (task: string, note: string) => void;
};

export default function AddEditModal({
  visible,
  title,
  initialTask = '',
  initialNote = '',
  noteMode = false,
  onClose,
  onSave,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState(initialTask);
  const [note, setNote] = useState(initialNote);
  const inputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const [internalVisible, setInternalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      setTimeout(() => {
        if (noteMode) noteInputRef.current?.focus();
        else inputRef.current?.focus();
      }, 100);
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setTask(initialTask);
      setNote(initialNote);
    }
  }, [visible, initialTask, initialNote]);

  function handleSave() {
    if (noteMode) {
      onSave('', note.trim());
      return;
    }
    const trimmed = task.trim();
    if (!trimmed) return;
    onSave(trimmed, note.trim());
  }

  const canSave = noteMode ? note.trim().length > 0 : task.trim().length > 0;

  return (
    <Modal visible={internalVisible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop — behind sheet in z-order (rendered first) */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.15)' }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sheet — above backdrop in z-order (rendered second) */}
        <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Math.max(12, insets.bottom), opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: theme.accent }]}>{title}</Text>

          {!noteMode && (
            <TextInput
              ref={inputRef}
              style={[styles.input, { backgroundColor: theme.checkboxBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Task"
              placeholderTextColor={theme.textSub}
              value={task}
              onChangeText={setTask}
              returnKeyType="next"
              maxLength={500}
            />
          )}

          <TextInput
            ref={noteInputRef}
            style={[styles.input, noteMode ? null : styles.noteInput, { backgroundColor: theme.checkboxBg, borderColor: theme.border, color: theme.text }]}
            placeholder={noteMode ? 'Note' : 'Note (optional)'}
            placeholderTextColor={theme.textSub}
            value={note}
            onChangeText={setNote}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            maxLength={500}
            multiline={noteMode}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.iconColor }, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  noteInput: {
    fontSize: 14,
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
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
