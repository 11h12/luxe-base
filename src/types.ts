export type Locale = 'vi' | 'en'
export type TaskSubtask = { id: string; title: string; done: boolean }
export type Task = { id: string; title: string; done: boolean; source?: 'lark' | 'local'; listId?: string; reminderAt?: string; tags?: string[]; subTasks?: TaskSubtask[] }
export type TaskCollection = { id: string; name: string }
export type Settings = {
  locale: Locale
  showCompletedTasks: boolean
  autoRotateMantras: boolean
  autoRotateQuotes: boolean
  backgroundUrl: string
}
