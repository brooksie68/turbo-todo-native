import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Todo } from '../lib/types';

const INDENT_PX = 20;
const MAX_DEPTH = 3;

type Props = {
  todo: Todo;
  depth: number;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onToggleComplete: (id: number, current: boolean) => void;
};

export default function TodoItem({
  todo,
  depth,
  collapsedIds,
  onToggleCollapse,
  onToggleComplete,
}: Props) {
  const hasChildren = (todo.children?.length ?? 0) > 0;
  const isCollapsed = collapsedIds.has(todo.id);
  const visibleChildren = todo.children ?? [];

  const depthColors = ['#1a2a38', '#3a5068', '#5a7088'];
  const textColor = todo.is_complete
    ? '#aaa'
    : depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <View style={{ paddingLeft: depth * INDENT_PX }}>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => {
          if (hasChildren) onToggleCollapse(todo.id);
        }}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, todo.is_complete && styles.checkboxDone]}
          onPress={() => onToggleComplete(todo.id, todo.is_complete)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {todo.is_complete && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Priority indicator */}
        {todo.status === 'top-priority' && (
          <Text style={[styles.priority, { color: '#b52a1a' }]}>!</Text>
        )}
        {todo.status === 'elevated' && (
          <Text style={[styles.priority, { color: '#c96a00' }]}>⚡</Text>
        )}

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: textColor, fontSize: depth === 0 ? 16 : depth === 1 ? 15 : 14 },
            todo.is_complete && styles.labelDone,
          ]}
          numberOfLines={0}
        >
          {todo.task}
        </Text>

        {/* Expand/collapse indicator */}
        {hasChildren && (
          <Text style={styles.chevron}>{isCollapsed ? '›' : '⌄'}</Text>
        )}
      </TouchableOpacity>

      {/* Note */}
      {todo.note ? (
        <Text style={[styles.note, { paddingLeft: 28 + depth * INDENT_PX }]}>
          {todo.note}
        </Text>
      ) : null}

      {/* Children */}
      {hasChildren && !isCollapsed && depth < MAX_DEPTH - 1 && (
        <View>
          {visibleChildren
            .slice()
            .sort((a, b) => {
              if (a.is_complete !== b.is_complete) return a.is_complete ? 1 : -1;
              return 0;
            })
            .map(child => (
              <TodoItem
                key={child.id}
                todo={child}
                depth={depth + 1}
                collapsedIds={collapsedIds}
                onToggleCollapse={onToggleCollapse}
                onToggleComplete={onToggleComplete}
              />
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#c7ba9b',
    borderRadius: 3,
    backgroundColor: '#fffdf5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: '#6a3f1f',
    borderColor: '#6a3f1f',
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  priority: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontWeight: '400',
  },
  labelDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  chevron: {
    color: '#6a3f1f',
    fontSize: 16,
    flexShrink: 0,
  },
  note: {
    fontSize: 12,
    color: '#888',
    paddingBottom: 4,
    fontStyle: 'italic',
  },
});
