/**
 * HelpIllustrations — small UI diagrams for each help section.
 * Matches the actual app UI as closely as possible. Themed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../lib/theme';
import { IconLogo, IconGear, IconCreateNew, IconOptions, IconExpandDown } from './Icons';

// ─── 1. Lists ───────────────────────────────────────────────────
// Reproduces the actual header bar: logo + list dropdown + gear icon

export function IllustrationLists() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.header, { backgroundColor: t.headerBg }]}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <IconLogo size={32} color={t.iconColor} />
      </View>
      {/* List selector dropdown — matches actual styles */}
      <View style={[styles.listSelector, { backgroundColor: t.listSelectorBg, borderBottomColor: t.listSelectorBorder }]}>
        <Text style={[styles.listSelectorText, { color: t.listSelectorText }]} numberOfLines={1}>
          Shopping List
        </Text>
        <Text style={[styles.listSelectorArrow, { color: t.listSelectorText }]}>▼</Text>
      </View>
      {/* Gear */}
      <View style={styles.gearWrap}>
        <IconGear size={22} color={t.iconColor} />
      </View>
    </View>
  );
}

// ─── 2. Adding Tasks ────────────────────────────────────────────
// Reproduces the actual toolbar: options | create new | expand

export function IllustrationAddingTasks() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.toolbar, { backgroundColor: t.headerBg, borderTopColor: t.border }]}>
      {/* Options — left */}
      <View style={styles.tbLeft}>
        <IconOptions size={24} color={t.iconColor} />
      </View>
      {/* Create new — center, full color to draw the eye */}
      <View style={styles.tbCenter}>
        <IconCreateNew size={24} color={t.iconColor} />
      </View>
      {/* Expand — right */}
      <View style={styles.tbRight}>
        <IconExpandDown size={24} color={t.iconColor} />
      </View>
    </View>
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
    <View style={[styles.subtaskBox, { borderColor: t.border }]}>
      {rows.map((row, i) => (
        <View key={i} style={[styles.subtaskRow, { marginLeft: row.indent, borderTopColor: t.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth }]}>
          <View style={[styles.checkbox, { borderColor: t.accent }]} />
          <Text style={[styles.subtaskLabel, { color: t.text }]}>{row.label}</Text>
          {row.hasAdd && <IconCreateNew size={16} color={t.iconColor} />}
        </View>
      ))}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Lists
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    paddingHorizontal: 8,
    gap: 8,
  },
  logoWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSelector: {
    flex: 1,
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
  gearWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Adding Tasks
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderTopWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tbLeft: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  tbCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbRight: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 8,
  },

  // Subtasks
  subtaskBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
});
