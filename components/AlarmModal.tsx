import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../lib/theme';

type Props = {
  visible: boolean;
  initialTime?: string | null;
  onSave: (time: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

function parseInitialTime(time: string | null | undefined): {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
} {
  if (!time) return { hour: 8, minute: 0, ampm: 'AM' };
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour, minute: m, ampm };
}

export default function AlarmModal({ visible, initialTime, onSave, onRemove, onClose }: Props) {
  const theme = useTheme();
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible) {
      const p = parseInitialTime(initialTime);
      setHour(p.hour);
      setMinute(p.minute);
      setAmpm(p.ampm);
    }
  }, [visible, initialTime]);

  function to24Hour(): string {
    let h = hour;
    if (ampm === 'AM' && h === 12) h = 0;
    if (ampm === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.centered} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Set alarm</Text>

          <View style={styles.pickerRow}>
            <View style={styles.col}>
              <TouchableOpacity
                onPress={() => setHour(h => h === 12 ? 1 : h + 1)}
                style={styles.nudge}
                hitSlop={{ top: 4, bottom: 4, left: 12, right: 12 }}
              >
                <Text style={[styles.arrow, { color: theme.iconColor }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[styles.digit, { color: theme.text }]}>{String(hour).padStart(2, '0')}</Text>
              <TouchableOpacity
                onPress={() => setHour(h => h === 1 ? 12 : h - 1)}
                style={styles.nudge}
                hitSlop={{ top: 4, bottom: 4, left: 12, right: 12 }}
              >
                <Text style={[styles.arrow, { color: theme.iconColor }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.colon, { color: theme.text }]}>:</Text>

            <View style={styles.col}>
              <TouchableOpacity
                onPress={() => setMinute(m => (m + 1) % 60)}
                style={styles.nudge}
                hitSlop={{ top: 4, bottom: 4, left: 12, right: 12 }}
              >
                <Text style={[styles.arrow, { color: theme.iconColor }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[styles.digit, { color: theme.text }]}>{String(minute).padStart(2, '0')}</Text>
              <TouchableOpacity
                onPress={() => setMinute(m => m === 0 ? 59 : m - 1)}
                style={styles.nudge}
                hitSlop={{ top: 4, bottom: 4, left: 12, right: 12 }}
              >
                <Text style={[styles.arrow, { color: theme.iconColor }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setAmpm(a => a === 'AM' ? 'PM' : 'AM')}
              style={[styles.ampmBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.ampmText, { color: theme.iconColor }]}>{ampm}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            {initialTime ? (
              <TouchableOpacity onPress={onRemove}>
                <Text style={[styles.btnText, { color: theme.danger }]}>Remove</Text>
              </TouchableOpacity>
            ) : <View />}
            <View style={styles.rightBtns}>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.btnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSave(to24Hour())}
                style={[styles.saveBtn, { backgroundColor: theme.iconColor }]}
              >
                <Text style={styles.saveBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: 280,
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  col: { alignItems: 'center', gap: 6 },
  nudge: { padding: 4 },
  arrow: { fontSize: 16, lineHeight: 18 },
  digit: { fontSize: 40, fontWeight: '300', width: 56, textAlign: 'center' },
  colon: { fontSize: 36, fontWeight: '300', marginBottom: 8 },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  ampmText: { fontSize: 16, fontWeight: '600' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rightBtns: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btnText: { fontSize: 15 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 4 },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
