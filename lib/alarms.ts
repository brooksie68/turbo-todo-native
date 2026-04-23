import * as Notifications from 'expo-notifications';
import type { Todo } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function buildNotificationBody(todo: Todo): string {
  const labels: string[] = [];
  for (const child of todo.children ?? []) {
    if (!child.is_complete) labels.push(child.task);
    for (const grandchild of child.children ?? []) {
      if (!grandchild.is_complete) labels.push(grandchild.task);
    }
  }
  const joined = labels.join(' · ');
  return joined.length > 120 ? joined.slice(0, 117) + '…' : joined;
}

export async function scheduleAlarm(todo: Todo, time: string): Promise<string> {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const title = todo.task.length > 50 ? todo.task.slice(0, 47) + '…' : todo.task;
  const body = buildNotificationBody(todo);

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: body || undefined,
      data: { taskId: todo.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAlarm(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
