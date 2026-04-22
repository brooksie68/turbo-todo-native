import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useThemeContext, themes } from '../lib/theme';
import type { List } from '../lib/types';
import { IconLogo, IconSettings, IconHelp } from './Icons';

type Props = {
  lists: List[];
  activeListId: number | null;
  activeList: List | null;
  onSwitchList: (id: number) => void;
  onCreateList: (name: string) => void;
  onRenameList: (id: number, name: string) => void;
  onDeleteList: (id: number) => void;
  onHelp: () => void;
};

export default function TodoListHeader({
  lists,
  activeListId,
  activeList,
  onSwitchList,
  onCreateList,
  onRenameList,
  onDeleteList,
  onHelp,
}: Props) {
  const { theme, themeId, setThemeId } = useThemeContext();
  const [showListPicker, setShowListPicker] = useState(false);
  const [themePickerLayout, setThemePickerLayout] = useState<{ top: number; left: number } | null>(null);
  const [gearMenuLayout, setGearMenuLayout] = useState<{ top: number; right: number } | null>(null);
  const [listNameModal, setListNameModal] = useState<'new' | 'rename' | null>(null);
  const [listNameInput, setListNameInput] = useState('');
  const logoBtnRef = useRef<View>(null);
  const gearBtnRef = useRef<View>(null);

  function openGearMenu() {
    gearBtnRef.current?.measure((x, y, w, h, pageX, pageY) => {
      setGearMenuLayout({ top: pageY + h + 4, right: 0 });
    });
  }

  function closeGearMenu() { setGearMenuLayout(null); }

  function handleNewList() {
    closeGearMenu();
    setListNameInput('');
    setListNameModal('new');
  }

  function handleRename() {
    closeGearMenu();
    setListNameInput(activeList?.name ?? '');
    setListNameModal('rename');
  }

  function handleDelete() {
    closeGearMenu();
    if (!activeList) return;
    Alert.alert(
      'Delete list?',
      `"${activeList.name}" and all its tasks will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            if (activeListId !== null) onDeleteList(activeListId);
          },
        },
      ],
    );
  }

  function handleListNameSave() {
    const name = listNameInput.trim();
    if (!name) return;
    if (listNameModal === 'new') {
      onCreateList(name);
    } else if (listNameModal === 'rename' && activeListId !== null) {
      onRenameList(activeListId, name);
    }
    setListNameModal(null);
  }

  return (
    <>
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        {/* Logo / theme picker */}
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

        {/* List selector */}
        <TouchableOpacity
          style={[styles.listSelector, { backgroundColor: theme.listSelectorBg, borderBottomColor: theme.listSelectorBorder }]}
          onPress={() => setShowListPicker(true)}
        >
          <Text style={[styles.listSelectorText, { color: theme.listSelectorText }]} numberOfLines={1}>
            {activeList?.name ?? '…'}
          </Text>
          <Text style={[styles.listSelectorArrow, { color: theme.listSelectorText }]}>▼</Text>
        </TouchableOpacity>

        {/* Gear / list options */}
        <View ref={gearBtnRef} collapsable={false} style={styles.gearBtn}>
          <TouchableOpacity style={styles.gearBtnInner} onPress={openGearMenu}>
            <IconSettings size={28} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        {/* Help */}
        <TouchableOpacity style={styles.helpBtn} onPress={onHelp}>
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
            styles.dropdown,
            { backgroundColor: theme.surface, borderColor: theme.border, top: themePickerLayout.top, left: themePickerLayout.left },
          ]}>
            {Object.values(themes).map((th, i, arr) => (
              <TouchableOpacity
                key={th.id}
                style={[styles.dropdownItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={() => { setThemeId(th.id); setThemePickerLayout(null); }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  { color: themeId === th.id ? theme.accent : theme.text },
                  themeId === th.id && styles.dropdownItemActive,
                ]}>
                  {th.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}

      {/* Gear / list options menu */}
      {gearMenuLayout && (
        <Modal visible transparent animationType="none" onRequestClose={closeGearMenu}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeGearMenu}
          />
          <View style={[
            styles.dropdown,
            styles.gearDropdown,
            { backgroundColor: theme.surface, borderColor: theme.border, top: gearMenuLayout.top, right: gearMenuLayout.right + 8 },
          ]}>
            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={handleNewList}
            >
              <Text style={[styles.dropdownItemText, { color: theme.text }]}>New list</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={handleRename}
            >
              <Text style={[styles.dropdownItemText, { color: theme.text }]}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleDelete}
            >
              <Text style={[styles.dropdownItemText, { color: theme.danger }]}>Delete list</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* List name input modal (new / rename) */}
      <Modal visible={listNameModal !== null} transparent animationType="fade" onRequestClose={() => setListNameModal(null)}>
        <KeyboardAvoidingView
          style={styles.nameModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setListNameModal(null)}
          />
          <View style={[styles.nameModalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.nameModalTitle, { color: theme.accent }]}>
              {listNameModal === 'new' ? 'New list' : 'Rename list'}
            </Text>
            <TextInput
              style={[styles.nameModalInput, { color: theme.text, borderColor: theme.border }]}
              value={listNameInput}
              onChangeText={setListNameInput}
              placeholder="List name"
              placeholderTextColor={theme.textSub ?? theme.accent}
              autoFocus
              onSubmitEditing={handleListNameSave}
              returnKeyType="done"
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity
                style={[styles.nameModalBtn, { backgroundColor: theme.border }]}
                onPress={() => setListNameModal(null)}
              >
                <Text style={[styles.nameModalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nameModalBtn, { backgroundColor: theme.accent }]}
                onPress={handleListNameSave}
              >
                <Text style={[styles.nameModalBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    width: 190,
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
    left: 259,
    top: 18,
    width: 28,
    height: 28,
  },
  gearBtnInner: {
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
  gearDropdown: {
    minWidth: 140,
  },
  dropdownItem: { paddingVertical: 11, paddingHorizontal: 12 },
  dropdownItemText: { fontSize: 16 },
  dropdownItemActive: { fontWeight: '600' },
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
  nameModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  nameModalBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  nameModalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  nameModalInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  nameModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  nameModalBtn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nameModalBtnText: { fontSize: 15 },
});
