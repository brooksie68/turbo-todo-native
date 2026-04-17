import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Todo } from '../lib/types';
import { IconOptions, IconAddBottom, IconBolt, IconPriorityHigh } from './Icons';

const INDENT_PX = 20;
const MAX_DEPTH = 3;

type Props = {
  todo: Todo;
  depth: number;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onToggleComplete: (id: number, current: boolean) => void;
  onLongPress: (todo: Todo, depth: number) => void;
  onAddSubtask: (parentId: number) => void;
};

export default function TodoItem({
  todo,
  depth,
  collapsedIds,
  onToggleCollapse,
  onToggleComplete,
  onLongPress,
  onAddSubtask,
}: Props) {
  const hasChildren = (todo.children?.length ?? 0) > 0;
  const isCollapsed = collapsedIds.has(todo.id);
  const visibleChildren = todo.children ?? [];
  const canAddChild = depth < MAX_DEPTH - 1;

  // Priority drives text color on incomplete items (matches web app)
  function getLabelColor() {
    if (todo.is_complete) return '#aaa';
    if (todo.status === 'top-priority') return '#b52a1a';
    if (todo.status === 'elevated') return '#c96a00';
    const depthColors = ['#1a2a38', '#3a5068', '#5a7088'];
    return depthColors[Math.min(depth, depthColors.length - 1)];
  }

  const labelColor = getLabelColor();
  const fontSize = depth === 0 ? 16 : depth === 1 ? 15 : 14;

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, { paddingLeft: 12 + depth * INDENT_PX }]}
        activeOpacity={0.7}
        onPress={() => { if (hasChildren) onToggleCollapse(todo.id); }}
        onLongPress={() => onLongPress(todo, depth)}
        delayLongPress={400}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, todo.is_complete && styles.checkboxDone]}
          onPress={() => onToggleComplete(todo.id, todo.is_complete)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {todo.is_complete && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Priority icon */}
        {todo.status === 'top-priority' && (
          <IconPriorityHigh size={16} color="#b52a1a" />
        )}
        {todo.status === 'elevated' && (
          <IconBolt size={16} color="#c96a00" />
        )}

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: labelColor, fontSize },
            todo.is_complete && styles.labelDone,
          ]}
          numberOfLines={0}
        >
          {todo.task}
        </Text>

        {/* Row actions: add-subtask + options */}
        <View style={styles.rowActions}>
          {canAddChild && !todo.is_complete && (
            <TouchableOpacity
              onPress={() => onAddSubtask(todo.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.rowActionBtn}
            >
              <IconAddBottom size={16} color="#025f96" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onLongPress(todo, depth)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.rowActionBtn}
          >
            <IconOptions size={16} color="#025f96" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Note */}
      {todo.note ? (
        <Text style={[styles.note, { paddingLeft: 12 + 26 + depth * INDENT_PX }]}>
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
                onLongPress={onLongPress}
                onAddSubtask={onAddSubtask}
              />
            ))}
        </View>
      )}

      {/* Row separator */}
      <View style={[styles.separator, { marginLeft: 12 + depth * INDENT_PX }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
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
  label: {
    flex: 1,
    fontWeight: '400',
  },
  labelDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  rowActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    fontSize: 12,
    color: '#888',
    paddingBottom: 4,
    paddingRight: 12,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#d9ccb4',
    marginRight: 0,
  },
});
