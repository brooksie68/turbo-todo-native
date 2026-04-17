export type List = {
  id: number
  user_id: string
  name: string
  sort_order: number
  inserted_at: string
}

export type Todo = {
  id: number
  user_id: string
  task: string
  is_complete: boolean
  parent_id: number | null
  list_id: number
  sort_order: number
  inserted_at: string
  note?: string | null
  status?: string | null
  children?: Todo[]
}
