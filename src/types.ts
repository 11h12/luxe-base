export type Locale = 'vi' | 'en'
export type Task = { id: string; title: string; done: boolean; source?: 'lark' | 'local' }
export type Settings = {
  locale: Locale
  showCompletedTasks: boolean
  autoRotateMantras: boolean
  autoRotateQuotes: boolean
  backgroundUrl: string
}
