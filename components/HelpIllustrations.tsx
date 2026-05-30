/**
 * HelpIllustrations — small UI diagrams for each help section.
 * Matches the actual app UI as closely as possible. Themed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../lib/theme';
import {
  IconLogo, IconGear, IconCreateNew, IconOptions, IconExpandDown,
  IconPriorityMedium, IconPriorityHigh, IconBell, IconPin,
} from './Icons';

// ─── Shared helpers ─────────────────────────────────────────────

function RowBox({ children }: { children: React.ReactNode }) {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.rowBox, { borderColor: t.scrollAreaBorder }]}>
      {children}
    </View>
  );
}

function TaskRow({
  label, done = false, icon, note, indent = 0, first = false, labelColor,
}: {
  label: string; done?: boolean; icon?: React.ReactNode;
  note?: string; indent?: number; first?: boolean; labelColor?: string;
}) {
  const { theme: t } = useThemeContext();
  return (
    <View style={{ marginLeft: indent }}>
      <View style={[
        styles.taskRow,
        { borderTopColor: t.scrollAreaBorder, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth },
      ]}>
        <View style={[
          styles.checkbox,
          done
            ? { backgroundColor: t.checkboxDoneBg, borderColor: t.checkboxDoneBg }
            : { borderColor: t.accent },
        ]}>
          {done && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text
          style={[styles.taskLabel, { color: labelColor ?? (done ? t.textDone : t.text) }, done && styles.strikethrough]}
          numberOfLines={1}
        >{label}</Text>
        {icon}
      </View>
      {note != null && (
        <View style={[styles.noteRow, { borderTopColor: t.scrollAreaBorder }]}>
          <Text style={[styles.noteText, { color: t.textNote }]} numberOfLines={2}>{note}</Text>
        </View>
      )}
    </View>
  );
}

// ─── 1. Lists ───────────────────────────────────────────────────

export function IllustrationLists() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.header, { backgroundColor: t.headerBg ?? 'transparent' }]}>
      <View style={styles.logoWrap}>
        <IconLogo size={32} color={t.iconColor} />
      </View>
      <View style={[styles.listSelector, { backgroundColor: t.listSelectorBg, borderBottomColor: t.listSelectorBorder }]}>
        <Text style={[styles.listSelectorText, { color: t.listSelectorText }]} numberOfLines={1}>
          Shopping List
        </Text>
        <Text style={[styles.listSelectorArrow, { color: t.listSelectorText }]}>▼</Text>
      </View>
      <View style={styles.gearWrap}>
        <IconGear size={22} color={t.iconColor} />
      </View>
    </View>
  );
}

// ─── 2. Adding Tasks ────────────────────────────────────────────

export function IllustrationAddingTasks() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.toolbar, { backgroundColor: t.headerBg ?? 'transparent', borderTopColor: t.scrollAreaBorder }]}>
      <View style={styles.tbLeft}>
        <IconOptions size={24} color={t.iconColor} />
      </View>
      <View style={styles.tbCenter}>
        <IconCreateNew size={24} color={t.iconColor} />
      </View>
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
    <View style={[styles.subtaskBox, { borderColor: t.scrollAreaBorder }]}>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[
            styles.subtaskRow,
            { marginLeft: row.indent, borderTopColor: t.scrollAreaBorder, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth },
          ]}
        >
          <View style={[styles.checkbox, { borderColor: t.accent }]} />
          <Text style={[styles.subtaskLabel, { color: t.text }]}>{row.label}</Text>
          {row.hasAdd && <IconCreateNew size={16} color={t.iconColor} />}
        </View>
      ))}
    </View>
  );
}

// ─── 4. Editing & Completing ────────────────────────────────────

export function IllustrationEditingCompleting() {
  return (
    <RowBox>
      <TaskRow label="Completed task" done first />
      <TaskRow label="Double-tap to edit" />
    </RowBox>
  );
}

// ─── 5. Priority ────────────────────────────────────────────────

export function IllustrationPriority() {
  const { theme: t } = useThemeContext();
  return (
    <RowBox>
      <TaskRow
        label="Elevated task"
        first
        labelColor={t.priorityElevated}
        icon={<IconPriorityMedium size={18} color={t.priorityElevated} />}
      />
      <TaskRow
        label="Top priority task"
        labelColor={t.priorityTop}
        icon={<IconPriorityHigh size={18} color={t.priorityTop} />}
      />
    </RowBox>
  );
}

// ─── 6. Pin to Top ──────────────────────────────────────────────

export function IllustrationPinToTop() {
  const { theme: t } = useThemeContext();
  return (
    <RowBox>
      <TaskRow
        label="Pinned task"
        first
        icon={<IconPin size={16} color={t.accent} />}
      />
      <View style={[styles.pinDivider, { backgroundColor: t.accent }]} />
      <TaskRow label="Regular task" />
      <TaskRow label="Regular task" />
    </RowBox>
  );
}

// ─── 7. Reordering ──────────────────────────────────────────────

export function IllustrationReordering() {
  const { theme: t } = useThemeContext();
  return (
    <RowBox>
      <TaskRow label="Task one" first />
      {/* Dragging row */}
      <View style={[
        styles.taskRow,
        styles.draggingRow,
        { borderTopColor: t.scrollAreaBorder, borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.accent },
      ]}>
        <View style={[styles.checkbox, { borderColor: t.accent }]} />
        <Text style={[styles.taskLabel, { color: t.text }]}>Long-press to drag</Text>
        <View style={styles.dragDots}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.dragDot, { backgroundColor: t.accent }]} />
          ))}
        </View>
      </View>
      <TaskRow label="Task three" />
    </RowBox>
  );
}

// ─── 8. Notes ───────────────────────────────────────────────────

export function IllustrationNotes() {
  return (
    <RowBox>
      <TaskRow
        label="Task with a note"
        first
        note="Pick up from the north side entrance."
      />
    </RowBox>
  );
}

// ─── 9. Images ──────────────────────────────────────────────────

export function IllustrationImages() {
  const { theme: t } = useThemeContext();
  return (
    <RowBox>
      <View style={[styles.taskRow, { borderTopWidth: 0 }]}>
        <View style={[styles.checkbox, { borderColor: t.accent }]} />
        <Text style={[styles.taskLabel, { color: t.text }]}>Task with images</Text>
      </View>
      <View style={[styles.thumbRow, { borderTopColor: t.scrollAreaBorder }]}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.thumb, { backgroundColor: t.listSelectorBg, borderColor: t.scrollAreaBorder }]}>
            <Text style={styles.thumbEmoji}>🖼</Text>
          </View>
        ))}
      </View>
    </RowBox>
  );
}

// ─── 10. Links ──────────────────────────────────────────────────

export function IllustrationLinks() {
  const { theme: t } = useThemeContext();
  return (
    <RowBox>
      <View style={[styles.taskRow, { borderTopWidth: 0 }]}>
        <View style={[styles.checkbox, { borderColor: t.accent }]} />
        <Text style={[styles.taskLabel, { color: t.text }]}>Task with a link</Text>
      </View>
      <View style={[styles.linkRow, { borderTopColor: t.scrollAreaBorder }]}>
        <Text style={[styles.linkText, { color: t.accent }]}>recipe-site.com →</Text>
      </View>
    </RowBox>
  );
}

// ─── 11. Alarms ─────────────────────────────────────────────────

export function IllustrationAlarms() {
  const { theme: t } = useThemeContext();
  return (
    <RowBox>
      <TaskRow
        label="Task with alarm  9:00 AM"
        first
        icon={<IconBell size={16} color={t.accent} />}
      />
    </RowBox>
  );
}

// ─── 12. Daily List ─────────────────────────────────────────────

export function IllustrationDailyList() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.header, { backgroundColor: t.headerBg ?? 'transparent' }]}>
      <View style={styles.logoWrap}>
        <IconLogo size={32} color={t.iconColor} />
      </View>
      <View style={[styles.listSelector, { backgroundColor: t.listSelectorBg, borderBottomColor: t.listSelectorBorder }]}>
        <Text style={[styles.listSelectorText, { color: t.listSelectorText }]} numberOfLines={1}>
          Daily
        </Text>
        <Text style={[styles.listSelectorArrow, { color: t.listSelectorText }]}>▼</Text>
      </View>
      <View style={styles.gearWrap}>
        <IconGear size={22} color={t.iconColor} />
      </View>
    </View>
  );
}

// ─── 13. Sounds ─────────────────────────────────────────────────

export function IllustrationSounds() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.optionsCard, { backgroundColor: t.menuBg, borderColor: t.scrollAreaBorder }]}>
      <Text style={[styles.optionLabel, { color: t.accent }]}>Sounds:</Text>
      <View style={styles.toggleGroup}>
        <Text style={[styles.toggleActive, { color: t.accent }]}>On</Text>
        <Text style={[styles.togglePipe, { color: t.scrollAreaBorder }]}>|</Text>
        <Text style={[styles.toggleInactive, { color: t.text }]}>Off</Text>
      </View>
    </View>
  );
}

// ─── 14. Export for AI ──────────────────────────────────────────

export function IllustrationExportForAI() {
  const { theme: t } = useThemeContext();
  const items = ['Add note', 'Set alarm', 'Export for AI'];
  return (
    <View style={[styles.menuBox, { backgroundColor: t.menuBg, borderColor: t.scrollAreaBorder }]}>
      {items.map((item, i) => (
        <View
          key={i}
          style={[
            styles.menuItem,
            { borderTopColor: t.scrollAreaBorder, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth },
            item === 'Export for AI' && { backgroundColor: t.listSelectorBg },
          ]}
        >
          <Text style={[
            styles.menuItemText,
            { color: t.text },
            item === 'Export for AI' && { color: t.accent, fontWeight: '600' },
          ]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── 15. Themes ─────────────────────────────────────────────────

export function IllustrationThemes() {
  const { theme: t } = useThemeContext();
  const themeNames = ['Default', 'Bimini Breeze', 'Dark Slate'];
  return (
    <View style={[styles.header, { backgroundColor: t.headerBg ?? 'transparent', alignItems: 'center', justifyContent: 'center' }]}>
      <View style={styles.logoWrap}>
        <IconLogo size={32} color={t.iconColor} />
      </View>
      <View style={[styles.themePicker, { backgroundColor: t.menuBg, borderColor: t.scrollAreaBorder }]}>
        {themeNames.map((name, i) => (
          <View
            key={i}
            style={[
              styles.themeItem,
              { borderTopColor: t.scrollAreaBorder, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[styles.themeItemText, { color: i === 0 ? t.accent : t.text }]}>{name}</Text>
            {i === 0 && <Text style={[styles.themeCheck, { color: t.accent }]}>✓</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── 16. Toolbar Options ────────────────────────────────────────

export function IllustrationToolbarOptions() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.toolbar, { backgroundColor: t.headerBg ?? 'transparent', borderTopColor: t.scrollAreaBorder }]}>
      <View style={[styles.tbLeft, { borderWidth: 1.5, borderColor: t.accent, borderRadius: 6 }]}>
        <IconOptions size={24} color={t.accent} />
      </View>
      <View style={styles.tbCenter}>
        <IconCreateNew size={24} color={t.iconColor} />
      </View>
      <View style={styles.tbRight}>
        <IconExpandDown size={24} color={t.iconColor} />
      </View>
    </View>
  );
}

// ─── 17. Expand / Collapse All ──────────────────────────────────

export function IllustrationExpandCollapse() {
  const { theme: t } = useThemeContext();
  return (
    <View style={[styles.toolbar, { backgroundColor: t.headerBg ?? 'transparent', borderTopColor: t.scrollAreaBorder }]}>
      <View style={styles.tbLeft}>
        <IconOptions size={24} color={t.iconColor} />
      </View>
      <View style={styles.tbCenter}>
        <IconCreateNew size={24} color={t.iconColor} />
      </View>
      <View style={[styles.tbRight, { borderWidth: 1.5, borderColor: t.accent, borderRadius: 6 }]}>
        <IconExpandDown size={24} color={t.accent} />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Lists / Daily List header strip
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

  // ── Toolbar strip (Adding Tasks / Toolbar Options / Expand)
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

  // ── Subtasks (section 3)
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
  subtaskLabel: {
    flex: 1,
    fontSize: 14,
  },

  // ── Shared task row box
  rowBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 10,
    color: '#fff',
    lineHeight: 14,
  },
  taskLabel: {
    flex: 1,
    fontSize: 14,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },

  // ── Note row
  noteRow: {
    paddingHorizontal: 36,
    paddingBottom: 8,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },

  // ── Pin divider
  pinDivider: {
    height: 1,
    opacity: 0.4,
  },

  // ── Reordering drag row
  draggingRow: {
    borderWidth: 1,
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dragDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 10,
    gap: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // ── Image thumbnails
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 22,
  },

  // ── Link row
  linkRow: {
    paddingHorizontal: 36,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  linkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  // ── Sounds option card
  optionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginBottom: 10,
    gap: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleActive: {
    fontSize: 14,
    fontWeight: '700',
  },
  togglePipe: {
    fontSize: 14,
  },
  toggleInactive: {
    fontSize: 14,
    opacity: 0.5,
  },

  // ── Menu box (Export for AI)
  menuBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 14,
  },

  // ── Theme picker
  themePicker: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    overflow: 'hidden',
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  themeItemText: {
    flex: 1,
    fontSize: 13,
  },
  themeCheck: {
    fontSize: 13,
    fontWeight: '700',
  },
});
