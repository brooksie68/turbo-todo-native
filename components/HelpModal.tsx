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
      'You can have multiple lists. Tap the list name in the header to switch between them.',
      'Tap the gear icon to create a new list, rename the current one, or delete it.',
    ],
  },
  {
    title: 'Adding Tasks',
    items: [
      'The toolbar has two add buttons. Add to Bottom places the new task at the end. Add to Top places it at the beginning.',
      'Type your task and tap OK or press Enter to save.',
    ],
  },
  {
    title: 'Subtasks',
    items: [
      'Tasks support up to 3 levels: Task → Subtask → Sub-subtask.',
      'Tap the + button on any row that can have children.',
      'The + button disappears at the deepest level.',
    ],
  },
  {
    title: 'Editing & Completing',
    items: [
      'Double-tap a row to edit it.',
      'Tap the checkbox to mark complete. Completed items sink to the bottom of their group.',
      'Tap a parent row to expand or collapse it.',
    ],
  },
  {
    title: 'Priority',
    items: [
      'Open a row\'s options menu (kebab icon) to set priority.',
      'Elevated shows a bolt icon. Top Priority shows an exclamation icon.',
    ],
  },
  {
    title: 'Pin to Top',
    items: [
      'Depth-0 tasks can be pinned. Pinned items float to the top of the incomplete list and cannot be dragged.',
      'Pin and unpin via the row options menu.',
    ],
  },
  {
    title: 'Reordering',
    items: [
      'Long-press a row and drag to reorder within the same level.',
      'Pinned items cannot be dragged.',
    ],
  },
  {
    title: 'Notes',
    items: [
      'Add a short note to any task via the options menu.',
    ],
  },
  {
    title: 'Images',
    items: [
      'Subtasks can have up to 5 attached photos.',
      'Tap Add image in the row options menu.',
      'Tap a thumbnail to view full-screen. Tap the close button or swipe back to dismiss.',
      'Tap ✕ on a thumbnail to remove it.',
    ],
  },
  {
    title: 'Links',
    items: [
      'Subtasks can have attached URLs.',
      'Tap Add URL in the row options menu. Enter a URL and an optional display name.',
      'Tap a link to open it in the browser.',
    ],
  },
  {
    title: 'Export for AI',
    items: [
      'Row options (depth 0–1): exports that item and its incomplete children as a markdown outline via the share sheet.',
      'Toolbar options: exports the full list the same way.',
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
      'Back up — saves all your lists, tasks, and images to a zip file. Save it to Google Drive or wherever you like.',
      'Restore — pick a backup zip to restore from. Replaces all current data.',
      'Sort by — tap Status, Date, or Alpha to re-sort incomplete items. One-time action; drag and drop freely afterward.',
      'Clear all completed — removes all checked tasks.',
      'Clear entire list — removes everything from the active list (asks to confirm).',
    ],
  },
  {
    title: 'Expand / Collapse All',
    items: [
      'The expand/collapse button in the toolbar toggles all rows at once.',
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
