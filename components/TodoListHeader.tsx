import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useThemeContext, themes } from '../lib/theme';
import type { List } from '../lib/types';
import { IconLogo, IconSettings, IconHelp } from './Icons';

type Props = {
  lists: List[];
  activeListId: number | null;
  activeList: List | null;
  onSwitchList: (id: number) => void;
};

export default function TodoListHeader({ lists, activeListId, activeList, onSwitchList }: Props) {
  const { theme, themeId, setThemeId } = useThemeContext();
  const [showListPicker, setShowListPicker] = useState(false);
  const [themePickerLayout, setThemePickerLayout] = useState<{ top: number; left: number } | null>(null);
  const logoBtnRef = useRef<View>(null);

  return (
    <>
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <View ref={logoBtnRef} collapsable={false} style={styles.logoBtn}>
          <TouchableOpacity
            style={styles.logoBtnInner}
            onPress={() => {
              if (themePickerLayout) { setThemePickerLayout(null); return; }
              logoBtnRef.current?.measure((x, y, w, h, pageX, pageY) => {
                setThemePickerLayout({ top: pageY + h + 4, left: pageX });
              });
            }}
          >
            <IconLogo size={42} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.listSelector, { backgroundColor: theme.listSelectorBg, borderBottomColor: theme.listSelectorBorder }]}
          onPress={() => setShowListPicker(true)}
        >
          <Text style={[styles.listSelectorText, { color: theme.listSelectorText }]} numberOfLines={1}>
            {activeList?.name ?? '…'}
          </Text>
          <Text style={[styles.listSelectorArrow, { color: theme.listSelectorText }]}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gearBtn}>
          <IconSettings size={28} color={theme.iconColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpBtn}>
          <IconHelp size={28} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      {/* List picker */}
      <Modal visible={showListPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowListPicker(false)}
        >
          <View style={[styles.listPickerDropdown, { backgroundColor: theme.listSelectorBg, borderColor: theme.border }]}>
            {lists.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[
                  styles.listPickerItem,
                  { borderBottomColor: theme.border },
                  l.id === activeListId && { backgroundColor: theme.surface },
                ]}
                onPress={() => { onSwitchList(l.id); setShowListPicker(false); }}
              >
                <Text style={[
                  styles.listPickerText,
                  { color: theme.listSelectorText },
                  l.id === activeListId && styles.listPickerTextActive,
                ]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme picker */}
      {themePickerLayout && (
        <Modal visible transparent animationType="none" onRequestClose={() => setThemePickerLayout(null)}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setThemePickerLayout(null)}
          />
          <View style={[
            styles.themeDropdown,
            { backgroundColor: theme.surface, borderColor: theme.border, top: themePickerLayout.top, left: themePickerLayout.left },
          ]}>
            {Object.values(themes).map((th, i, arr) => (
              <TouchableOpacity
                key={th.id}
                style={[styles.themeItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={() => { setThemeId(th.id); setThemePickerLayout(null); }}
              >
                <Text style={[
                  styles.themeItemText,
                  { color: themeId === th.id ? theme.accent : theme.text },
                  themeId === th.id && styles.themeItemActive,
                ]}>
                  {th.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { height: 64 },
  logoBtn: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 42,
    height: 42,
  },
  logoBtnInner: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSelector: {
    position: 'absolute',
    left: 60,
    top: 15,
    width: 189,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    gap: 6,
  },
  listSelectorText: { flex: 1, fontSize: 15 },
  listSelectorArrow: { fontSize: 10 },
  gearBtn: {
    position: 'absolute',
    left: 258,
    top: 18,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtn: {
    position: 'absolute',
    right: 19,
    top: 18,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDropdown: {
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
  themeItem: { paddingVertical: 11, paddingHorizontal: 12 },
  themeItemText: { fontSize: 16 },
  themeItemActive: { fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: 12,
  },
  listPickerDropdown: {
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  listPickerText: { fontSize: 15 },
  listPickerTextActive: { fontWeight: '600' },
});
