import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { IconOptions, IconExpandDown, IconExpandUp } from './Icons';

type Props = {
  onOpenMenu: () => void;
  onAddNew: () => void;
  onToggleAll: () => void;
  allExpanded: boolean;
};

export default function TodoListToolbar({
  onOpenMenu,
  onAddNew,
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

        <TouchableOpacity style={styles.toolbarCenter} onPress={onAddNew}>
          <Text style={[styles.addPlus, { color: theme.iconColor }]}>+</Text>
        </TouchableOpacity>

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
  },
  toolbarCenter: {
    position: 'absolute',
    left: 80,
    right: 80,
    top: 0,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
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
