import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Animated,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (url: string, name: string) => void;
};

export default function AddLinkModal({ visible, onClose, onSave }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const urlInputRef = useRef<TextInput>(null);
  const [internalVisible, setInternalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setUrl('');
      setName('');
      setInternalVisible(true);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      setTimeout(() => urlInputRef.current?.focus(), 100);
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const change = Keyboard.addListener('keyboardDidChangeFrame', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); change.remove(); hide.remove(); };
  }, []);

  function handleSave() {
    let finalUrl = url.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    onSave(finalUrl, name.trim());
  }

  return (
    <Modal visible={internalVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: keyboardHeight > 0 ? keyboardHeight + 72 : Math.max(20, insets.bottom), opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: theme.accent }]}>Add URL</Text>

          <TextInput
            ref={urlInputRef}
            style={[styles.input, { backgroundColor: theme.checkboxBg, borderColor: theme.border, color: theme.text }]}
            placeholder="URL (required)"
            placeholderTextColor={theme.textSub}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
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
