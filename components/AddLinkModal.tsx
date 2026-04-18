import { useState, useEffect } from 'react';
import { useTheme } from '../lib/theme';
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
  onClose: () => void;
  onSave: (url: string, name: string) => void;
};

export default function AddLinkModal({ visible, onClose, onSave }: Props) {
  const theme = useTheme();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) { setUrl(''); setName(''); }
  }, [visible]);

  function handleSave() {
    let finalUrl = url.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    onSave(finalUrl, name.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.accent }]}>Add URL</Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.checkboxBg, borderColor: theme.border, color: theme.text }]}
            placeholder="URL (required)"
            placeholderTextColor={theme.textSub}
            value={url}
            onChangeText={setUrl}
            autoFocus
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="next"
            maxLength={2000}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.checkboxBg, borderColor: theme.border, color: theme.text }]}
            placeholder="Name (optional)"
            placeholderTextColor={theme.textSub}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            maxLength={200}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.iconColor }, !url.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!url.trim()}
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { fontSize: 15 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
