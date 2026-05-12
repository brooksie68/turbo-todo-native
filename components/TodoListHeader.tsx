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
  Dimensions,
} from 'react-native';
import { useThemeContext, themes } from '../lib/theme';
import type { List } from '../lib/types';
import { IconLogo, IconGear, IconHelp } from './Icons';

type Props = {
  lists: List[];
  activeListId: number | null;
  activeList: List | null;
  isDailyList: boolean;
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
  isDailyList,
  onSwitchList,
  onCreateList,
  onRenameList,
  onDeleteList,
  onHelp,
}: Props) {
  const { theme, themeId, setThemeId } = useThemeContext();
  const ff = theme.fontFamily ? `${theme.fontFamily}-Regular` : undefined;
  const [listPickerLayout, setListPickerLayout] = useState<{ top: number; left: number } | null>(null);
  const [themePickerLayout, setThemePickerLayout] = useState<{ top: number; left: number } | null>(null);
  const [gearMenuLayout, setGearMenuLayout] = useState<{ top: number; left: number } | null>(null);
  const [listNameModal, setListNameModal] = useState<'new' | 'rename' | null>(null);
  const [listNameInput, setListNameInput] = useState('');
  const logoBtnRef = useRef<View>(null);
  const gearBtnRef = useRef<View>(null);
  const listSelectorRef = useRef<View>(null);

  function openGearMenu() {
    const screenWidth = Dimensions.get('window').width;
    gearBtnRef.current?.measure((x, y, w, h, pageX, pageY) => {
      const centerX = pageX + w / 2;
      const left = Math.max(8, Math.min(centerX - 80, screenWidth - 168));
      setGearMenuLayout({ top: pageY + h + 4, left });
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
      <View style={[styles.header, { backgroundColor: 'transparent', borderTopWidth: 1, borderTopColor: theme.headerBorder }]}>
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
            <IconLogo size={40} color={theme.iconColor} gradient={theme.iconGradient ?? undefined} />
          </TouchableOpacity>
        </View>

        {/* List selector */}
        <View ref={listSelectorRef} collapsable={false} style={[styles.listSelector, { backgroundColor: theme.listSelectorBg, borderBottomColor: theme.listSelectorBorder }]}>
          <TouchableOpacity
            style={styles.listSelectorInner}
            onPress={() => {
              if (listPickerLayout) { setListPickerLayout(null); return; }
              listSelectorRef.current?.measure((x, y, w, h, pageX, pageY) => {
                setListPickerLayout({ top: pageY + h + 4, left: pageX });
              });
            }}
          >
            <Text style={[styles.listSelectorText, { color: theme.listSelectorText, fontFamily: ff }]} numberOfLines={1}>
              {activeList?.name ?? '…'}
            </Text>
            <Text style={[styles.listSelectorArrow, { color: theme.listSelectorText, fontFamily: ff }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Gear / list options */}
        <View ref={gearBtnRef} collapsable={false} style={styles.gearBtn}>
          <TouchableOpacity style={styles.gearBtnInner} onPress={openGearMenu}>
            <IconGear size={24} color={theme.iconColor} gradient={theme.iconGradient ?? undefined} />
          </TouchableOpacity>
        </View>

        {/* Help */}
        <TouchableOpacity style={styles.helpBtn} onPress={onHelp}>
          <IconHelp size={24} color={theme.iconColor} gradient={theme.iconGradient ?? undefined} />
        </TouchableOpacity>
      </View>

      {/* List picker */}
      {listPickerLayout && (
        <Modal visible transparent animationType="none" onRequestClose={() => setListPickerLayout(null)}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setListPickerLayout(null)}
          />
          <View style={[
            styles.listPickerDropdown,
            { backgroundColor: theme.listSelectorBg, borderColor: theme.border, top: listPickerLayout.top, left: listPickerLayout.left },
          ]}>
            {lists.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[
                  styles.listPickerItem,
                  { borderBottomColor: theme.border },
                  l.id === activeListId && { backgroundColor: theme.surface },
                ]}
                onPress={() => { onSwitchList(l.id); setListPickerLayout(null); }}
              >
                <Text style={[
                  styles.listPickerText,
                  { color: theme.listSelectorText, fontFamily: ff },
                  l.id === activeListId && styles.listPickerTextActive,
                ]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}

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
            {Object.values(themes).filter(th => th.enabled !== false).map((th, i, arr) => (
              <TouchableOpacity
                key={th.id}
                style={[styles.dropdownItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={() => { setThemeId(th.id); setThemePickerLayout(null); }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  { color: themeId === th.id ? theme.accent : theme.text, fontFamily: ff },
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
            { backgroundColor: theme.surface, borderColor: theme.border, top: gearMenuLayout.top, left: gearMenuLayout.left },
          ]}>
            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={handleNewList}
            >
              <Text style={[styles.dropdownItemText, { color: theme.text, fontFamily: ff }]}>New list</Text>
            </TouchableOpacity>
            {!isDailyList && (
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={handleRename}
              >
                <Text style={[styles.dropdownItemText, { color: theme.text, fontFamily: ff }]}>Rename</Text>
              </TouchableOpacity>
            )}
            {!isDailyList && (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleDelete}
              >
                <Text style={[styles.dropdownItemText, { color: theme.danger, fontFamily: ff }]}>Delete list</Text>
              </TouchableOpacity>
            )}
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
            <Text style={[styles.nameModalTitle, { color: theme.accent, fontFamily: ff }]}>
              {listNameModal === 'new' ? 'New list' : 'Rename list'}
            </Text>
            <TextInput
              style={[styles.nameModalInput, { color: theme.text, borderColor: theme.border, fontFamily: ff }]}
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
                <Text style={[styles.nameModalBtnText, { color: theme.text, fontFamily: ff }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nameModalBtn, { backgroundColor: theme.accent }]}
                onPress={handleListNameSave}
              >
                <Text style={[styles.nameModalBtnText, { color: '#fff', fontFamily: ff }]}>Save</Text>
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
    top: 12,
    width: 40,
    height: 40,
  },
  logoBtnInner: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSelector: {
    position: 'absolute',
    left: 60,
    top: 15,
    width: 189,
    height: 34,
    borderBottomWidth: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  listSelectorInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  listSelectorText: { flex: 1, fontSize: 15 },
  listSelectorArrow: { fontSize: 10 },
  gearBtn: {
    position: 'absolute',
    left: 262,
    top: 20,
    width: 24,
    height: 24,
  },
  gearBtnInner: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtn: {
    position: 'absolute',
    right: 19,
    top: 20,
    width: 24,
    height: 24,
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
    width: 160,
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
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 189,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
