import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../lib/theme';
import { IconClose } from './Icons';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Section = { title: string; items: string[] };

const sections: Section[] = [
  {
    title: 'Lists',
    items: [
      'Tap the list name in the header to switch between lists.',
      'Tap the gear icon to create a new list, rename it, or delete it.',
    ],
  },
  {
    title: 'Adding Tasks',
    items: [
      'Tap the + button in the toolbar to add a task to the top of the list.',
      'Type your task, then tap OK or press Enter.',
    ],
  },
  {
    title: 'Subtasks',
    items: [
      'Tasks support up to 3 levels: Task → Subtask → Sub-subtask.',
      'Tap the + button on any row that can have children.',
      "The + button doesn't appear at the deepest level.",
    ],
  },
  {
    title: 'Editing & Completing',
    items: [
      'Double-tap a row to edit it.',
      'Tap the checkbox to complete a task. Completed items move to the bottom of their group.',
      'Tap a parent row to expand or collapse it.',
    ],
  },
  {
    title: 'Priority',
    items: [
      'Open a row\'s options menu (kebab icon) to set priority.',
      'Elevated: bolt icon. Top Priority: exclamation icon.',
    ],
  },
  {
    title: 'Pin to Top',
    items: [
      "Pinned top-level tasks stay above the list and can't be dragged.",
      'Pin and unpin via the options menu.',
    ],
  },
  {
    title: 'Reordering',
    items: [
      'Long-press a row and drag to reorder within the same level.',
      'Pinned and completed items cannot be dragged.',
    ],
  },
  {
    title: 'Notes',
    items: [
      'Add a note to any task via the options menu.',
      'Notes appear below the task label. Tap ✕ on the note to delete it.',
      'To edit a note, tap Edit note in the options menu.',
      'Notes on completed tasks show with a strikethrough.',
    ],
  },
  {
    title: 'Images',
    items: [
      'Top-level tasks and subtasks support up to 5 attached photos.',
      'Tap Add image in the row options menu.',
      'Tap a thumbnail to view full-screen. Close with the close button or the back gesture.',
      'Tap ✕ on a thumbnail to remove it.',
    ],
  },
  {
    title: 'Links',
    items: [
      'Top-level tasks and subtasks support attached URLs.',
      'Tap Add URL in the options menu. Enter a URL and an optional display name.',
      'Tap a link to open it in the browser.',
    ],
  },
  {
    title: 'Alarms',
    items: [
      'Set a daily repeating alarm on any top-level task or subtask via the options menu.',
      'A bell icon appears on the row when an alarm is set.',
      'Alarms are automatically cancelled when the task is completed or deleted.',
      'Setting a new alarm replaces the old one.',
    ],
  },
  {
    title: 'Daily List',
    items: [
      'The Daily List is a special list for your focus items each day.',
      'Turn it on in toolbar options. It appears at the front of the list picker.',
      'Send tasks from any list to the Daily List via the row options menu.',
      'At midnight, items sent from other lists return to their original list. Items added directly to the Daily List are removed.',
    ],
  },
  {
    title: 'Export for AI',
    items: [
      'Row options (top-level tasks and subtasks): exports that item and its incomplete children as a markdown outline via the share sheet.',
      'Toolbar options: exports the entire active list the same way.',
      'Paste directly into a chat with your AI assistant.',
    ],
  },
  {
    title: 'Themes',
    items: [
      'Tap the logo to browse and switch themes.',
    ],
  },
  {
    title: 'Toolbar Options',
    items: [
      'Back up — saves all lists, tasks, and images to a zip file you can store anywhere.',
      'Restore — pick a backup zip to restore from. Replaces all current data.',
      'Sort by — tap Status, Date, or Alpha to re-sort incomplete items. This is a one-time sort; drag and drop freely afterward.',
      'Daily List — turn the Daily List on or off.',
      'Text size — use + and − to adjust task text size. Five sizes available.',
      'Clear all completed — removes all completed tasks across all levels.',
      'Clear entire list — removes everything in the active list. Asks to confirm.',
    ],
  },
  {
    title: 'Expand / Collapse All',
    items: [
      'The expand/collapse button toggles all rows at once.',
    ],
  },
];

export default function HelpModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const t = theme;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: t.surface, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <Text style={[styles.title, { color: t.text }]}>Help</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <IconClose size={22} color={t.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          {sections.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.accent }]}>{section.title}</Text>
              {section.items.map((item, i) => (
                <View key={i} style={styles.item}>
                  <Text style={[styles.bullet, { color: t.accent }]}>·</Text>
                  <Text style={[styles.itemText, { color: t.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  section: { gap: 6 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  item: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 22,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
