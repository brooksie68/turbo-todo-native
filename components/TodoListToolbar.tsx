import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { IconOptions, IconAddBottom, IconAddTop, IconExpandDown, IconExpandUp } from './Icons';

type Props = {
  onOpenMenu: () => void;
  onAddBottom: () => void;
  onAddTop: () => void;
  onToggleAll: () => void;
  allExpanded: boolean;
};

export default function TodoListToolbar({
  onOpenMenu,
  onAddBottom,
  onAddTop,
  onToggleAll,
  allExpanded,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.toolbarOuter, { backgroundColor: 'transparent', borderTopColor: theme.headerBorder, paddingBottom: insets.bottom }]}>
      <View style={styles.toolbarInner}>
        <TouchableOpacity style={styles.toolbarLeft} onPress={onOpenMenu}>
          <IconOptions size={24} color={theme.iconColor} />
        </TouchableOpacity>

        <View style={styles.toolbarCenter}>
          <TouchableOpacity style={styles.toolbarIconBtn} onPress={onAddBottom}>
            <IconAddBottom size={18} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.newLabel, { color: theme.iconColor }]}>new</Text>
          <TouchableOpacity style={styles.toolbarIconBtn} onPress={onAddTop}>
            <IconAddTop size={18} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.toolbarRight} onPress={onToggleAll}>
          {allExpanded
            ? <IconExpandUp size={24} color={theme.iconColor} />
            : <IconExpandDown size={24} color={theme.iconColor} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbarOuter: { borderTopWidth: 1 },
  toolbarInner: { height: 42 },
  toolbarLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: 0,
  },
  toolbarCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolbarIconBtn: { padding: 4 },
  newLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  toolbarRight: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 58,
    height: 30,
    paddingRight: 22,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
