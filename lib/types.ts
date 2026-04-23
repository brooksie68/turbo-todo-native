export type List = {
  id: number;
  name: string;
  sort_order: number;
  inserted_at: string;
};

export type Todo = {
  id: number;
  task: string;
  is_complete: boolean;
  parent_id: number | null;
  list_id: number;
  sort_order: number;
  inserted_at: string;
  note?: string | null;
  status?: string | null;
  pinned?: boolean;
  alarm_time?: string | null;
  notification_id?: string | null;
  children?: Todo[];
};
