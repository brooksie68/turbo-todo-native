/**
 * HelpIllustrations — small schematic UI diagrams for each help section.
 * Composed from Views + existing Icon components. Themed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../lib/theme';
import { IconGear, IconCreateNew, IconOptions, IconExpandDown } from './Icons';

// ─── Shared wrapper ─────────────────────────────────────────────

function IllustrationBox({ children }: { children: React.ReactNode }) {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.border }]}>
      {children}
    </View>
  );
}

// ─── 1. Lists ───────────────────────────────────────────────────

export function IllustrationLists() {
  const { theme: t } = useThemeContext();
  return (
    <IllustrationBox>
      {/* Simulated header bar */}
      <View style={[styles.headerBar, { backgroundColor: t.headerBg ?? t.surface, borderBottomColor: t.border }]}>
        {/* List name pill */}
        <View style={[styles.listPill, { borderColor: t.accent }]}>
          <Text style={[styles.listPillText, { color: t.text }]}>Shopping List</Text>
          <Text style={[styles.listPillCaret, { color: t.accent }]}>▾</Text>
        </View>
        {/* Gear icon */}
        <View style={styles.gearWrap}>
          <IconGear size={20} color={t.iconColor} />
        </View>
      </View>
    </IllustrationBox>
  );
}

// ─── 2. Adding Tasks ────────────────────────────────────────────

export function IllustrationAddingTasks() {
  const { theme: t } = useThemeContext();
  return (
    <IllustrationBox>
      <View style={[styles.toolbar, { borderTopColor: t.border }]}>
        {/* Options icon — dim */}
        <View style={styles.toolbarLeft}>
          <IconOptions size={20} color={t.iconColor + '55'} />
        </View>
        {/* Create new — highlighted */}
        <View style={[styles.toolbarCenter, styles.highlighted, { borderColor: t.accent, backgroundColor: t.accent + '18' }]}>
          <IconCreateNew size={22} color={t.accent} />
          <Text style={[styles.tapLabel, { color: t.accent }]}>tap to add</Text>
        </View>
        {/* Expand icon — dim */}
        <View style={styles.toolbarRight}>
          <IconExpandDown size={20} color={t.iconColor + '55'} />
        </View>
      </View>
    </IllustrationBox>
  );
}

// ─── 3. Subtasks ────────────────────────────────────────────────

export function IllustrationSubtasks() {
  const { theme: t } = useThemeContext();
  const rows = [
    { label: 'Task', indent: 0, hasAdd: true },
    { label: 'Subtask', indent: 16, hasAdd: true },
    { label: 'Sub-subtask', indent: 32, hasAdd: false },
  ];
  return (
    <IllustrationBox>
      <View style={styles.subtaskList}>
        {rows.map((row, i) => (
          <View key={i} style={[styles.subtaskRow, { marginLeft: row.indent }]}>
            {/* Checkbox */}
            <View style={[styles.checkbox, { borderColor: t.accent }]} />
            {/* Label */}
            <Text style={[styles.subtaskLabel, { color: t.text }]}>{row.label}</Text>
            {/* + button */}
            {row.hasAdd && (
              <View style={styles.addBtn}>
                <IconCreateNew size={14} color={t.accent} />
              </View>
            )}
          </View>
        ))}
      </View>
    </IllustrationBox>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },

  // Lists
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  listPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  listPillText: { fontSize: 14, fontWeight: '500' },
  listPillCaret: { fontSize: 12 },
  gearWrap: { position: 'absolute', right: 16 },

  // Adding Tasks
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  toolbarLeft: { flex: 1, alignItems: 'flex-start' },
  toolbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toolbarRight: { flex: 1, alignItems: 'flex-end' },
  highlighted: {},
  tapLabel: { fontSize: 12, fontWeight: '600' },

  // Subtasks
  subtaskList: {
    padding: 12,
    gap: 10,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
  },
  subtaskLabel: {
    flex: 1,
    fontSize: 14,
  },
  addBtn: {
    padding: 2,
  },
});
