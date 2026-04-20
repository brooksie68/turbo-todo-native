import { useCallback } from 'react';
import { Alert } from 'react-native';
import { runMigration, isMigrationDone } from '../lib/migration';
import migrationData from '../lib/migration-data.json';
import type { TodoData } from './useTodoData';

export function useImport(data: Pick<TodoData, 'fetchLists' | 'fetchTodos'>) {
  const handleImport = useCallback(async () => {
    const done = await isMigrationDone();
    if (done) {
      Alert.alert('Already imported', 'Supabase data has already been imported.');
      return;
    }
    Alert.alert(
      'Import from Supabase?',
      `This will load ${migrationData.lists.length} lists and ${migrationData.todos.length} tasks into the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import', onPress: async () => {
            await runMigration(migrationData as any);
            await data.fetchLists();
            const firstListId = (migrationData as any).lists[0]?.id;
            if (firstListId) data.fetchTodos(firstListId, true);
          },
        },
      ],
    );
  }, [data.fetchLists, data.fetchTodos]);

  return { handleImport };
}
