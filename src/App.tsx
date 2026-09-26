import { useEffect, useMemo, useState } from 'react'
import { Clock } from './components/Clock'
import { NotesPanel } from './components/NotesPanel'
import { SettingsModal } from './components/SettingsModal'
import { TaskList } from './components/TaskList'
import { CalendarIcon, CloudIcon, FocusIcon, SlidersHorizontalIcon, SquareCheckBigIcon } from './components/Icons'
import { getFocusSession, getSettings, getTaskCollections, getTasks, seedMantras, seedQuotes, setFocusSession, setSettings, setTaskCollections, setTasks } from './storage'
import type { FocusSession, Settings, Task, TaskCollection } from './types'

const sites = [
  ['▲', 'Vercel'], ['›', 'AdGuard Home'], ['N', 'The AI works...'], ['◖', 'GitHub'], ['›', 'Lark Base: AI...'], ['›', 'Create Next ...'],
]

const greetings = {
  vi: ['Chào buổi sáng', 'Chào buổi chiều', 'Chào buổi tối'],
  en: ['Good morning', 'Good afternoon', 'Good evening'],
} as const
const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function TopSites() {
  return <section className="fixed right-10 top-1/2 z-20 hidden w-[222px] -translate-y-1/2 rounded-[26px] border border-white/10 bg-[#382b0dbd] px-4 py-4 text-white shadow-2xl backdrop-blur-xl xl:block">
    <header className="mb-4 flex items-center justify-between text-[11px] font-semibold tracking-wide text-white/45"><span>TOP SITES</span><span>⠿</span></header>
    <div className="grid grid-cols-2 gap-x-4 gap-y-4">{sites.map(([icon, title]) => <button key={title} className="group flex min-w-0 flex-col items-center gap-1.5 text-center"><span className="flex size-11 items-center justify-center rounded-full bg-black/45 text-xl font-bold text-white ring-1 ring-white/10 transition group-hover:bg-black/65">{icon}</span><span className="w-full truncate text-[10px] font-semibold text-white/75">{title}</span></button>)}</div>
    <button className="mx-auto mt-5 flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-medium text-white/50 transition hover:bg-white/10"><span className="mb-1 text-3xl font-light leading-none">+</span>Add website</button>
  </section>
}

function RoundButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?(): void }) {
  return <button onClick={onClick} aria-label={label} className="luxe-glass-surface luxe-glass-surface--action flex size-12 items-center justify-center rounded-full text-xl text-white/90 shadow-sm transition">{children}</button>
}

function FocusModeOverlay({ task, session, onEnd }: { task: Task; session: FocusSession; onEnd(): void }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const elapsed = Math.max(0, Math.floor((currentTime - new Date(session.startedAt).getTime()) / 1000))
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-label="Focus mode" className="luxe-glass-surface w-[min(460px,calc(100vw-32px))] rounded-[28px] border border-white/20 bg-[#182126]/95 p-7 text-center shadow-[0_28px_80px_rgba(0,0,0,.55)]"><FocusIcon className="mx-auto size-8 text-white/80" /><p className="mt-4 text-sm font-semibold uppercase tracking-[.16em] text-white/48">Focus mode</p><h2 className="mt-3 text-[26px] font-semibold leading-tight text-white">{task.title}</h2><time className="mt-7 block text-[54px] font-semibold tabular-nums tracking-[-.06em] text-white">{minutes}:{seconds}</time><p className="mt-2 text-sm text-white/52">Focus session is running</p><button type="button" onClick={onEnd} className="mt-7 h-11 rounded-full bg-white/16 px-6 text-sm font-semibold text-white transition hover:bg-white/25">End focus</button></section></div>
}

export function App() {
  const [settings, updateSettings] = useState<Settings>(getSettings)
  const [tasks, updateTasks] = useState<Task[]>(getTasks)
  const [taskCollections, updateTaskCollections] = useState<TaskCollection[]>(getTaskCollections)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [tasksExpanded, setTasksExpanded] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [focusSession, updateFocusSession] = useState<FocusSession | null>(getFocusSession)
  const [focusOpen, setFocusOpen] = useState(() => Boolean(getFocusSession()))
  const [mantras, setMantras] = useState<string[]>(() => seedMantras(settings.locale))
  const [quotes, setQuotes] = useState<string[]>(() => seedQuotes(settings.locale))
  const [index, setIndex] = useState(0)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [name] = useState(() => localStorage.getItem('luxe_user_name') || 'Dương')
  const mantra = useMemo(() => mantras[index % Math.max(mantras.length, 1)] ?? '', [mantras, index])
  const quote = useMemo(() => quotes[quoteIndex % Math.max(quotes.length, 1)] ?? '', [quotes, quoteIndex])
  const focusedTask = focusSession ? tasks.find(task => task.id === focusSession.taskId) : undefined
  const dailyGoalTasks = tasks.filter(task => !task.done && task.tags?.includes('daily-goal') && task.dueDate === localDateKey())
  const hour = new Date().getHours()
  const greeting = greetings[settings.locale][hour < 12 ? 0 : hour < 18 ? 1 : 2]
  useEffect(() => { setSettings(settings) }, [settings])
  useEffect(() => { setTasks(tasks) }, [tasks])
  useEffect(() => {
    const runtime = (globalThis as typeof globalThis & { chrome?: { runtime?: { sendMessage(message: unknown): Promise<unknown> } } }).chrome?.runtime
    if (!runtime) return
    void runtime.sendMessage({ type: 'sync-task-reminders', tasks: tasks.map(task => ({ id: task.id, title: task.title, dueDate: task.dueDate, dueTime: task.dueTime, done: task.done })) }).catch(() => undefined)
  }, [tasks])
  useEffect(() => { setTaskCollections(taskCollections) }, [taskCollections])
  useEffect(() => { setFocusSession(focusSession) }, [focusSession])
  useEffect(() => { if (focusSession && !focusedTask) { updateFocusSession(null); setFocusOpen(false) } }, [focusSession, focusedTask])
  useEffect(() => { setMantras(seedMantras(settings.locale)); setQuotes(seedQuotes(settings.locale)); setIndex(0); setQuoteIndex(0) }, [settings.locale])
  useEffect(() => { if (!settings.autoRotateMantras) return; const timer = window.setInterval(() => setIndex(value => value + 1), 30 * 60 * 1000); return () => clearInterval(timer) }, [settings.autoRotateMantras])
  useEffect(() => { if (!settings.autoRotateQuotes) return; const timer = window.setInterval(() => setQuoteIndex(value => value + 1), 30 * 60 * 1000); return () => clearInterval(timer) }, [settings.autoRotateQuotes])
  useEffect(() => {
    const refresh = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key
      if (key === 'dbindex_mantras') { setMantras(seedMantras(settings.locale)); setIndex(0) }
      if (key === 'dbindex_quotes') { setQuotes(seedQuotes(settings.locale)); setQuoteIndex(0) }
    }
    window.addEventListener('luxe-content-changed', refresh)
    return () => window.removeEventListener('luxe-content-changed', refresh)
  }, [settings.locale])
  const toggleCompleted = () => updateSettings(value => ({ ...value, showCompletedTasks: !value.showCompletedTasks }))
  const startFocus = (task: Task) => { updateTasks(current => current.map(item => item.id === task.id ? { ...item, status: 'in_progress' } : item)); updateFocusSession({ taskId: task.id, startedAt: new Date().toISOString() }); setFocusOpen(true); setTasksOpen(false) }
  const endFocus = () => { updateFocusSession(null); setFocusOpen(false) }
  const setTaskDailyGoal = (task: Task) => updateTasks(current => current.map(item => item.id === task.id ? { ...item, tags: [...new Set([...(item.tags ?? []), 'daily-goal'])], dueDate: localDateKey() } : item))

  return <main className="relative min-h-screen overflow-hidden bg-[#102334] text-white">
    <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.04), rgba(0,0,0,.20)), url("${settings.backgroundUrl}")` }} />
    <div className="fixed left-8 top-8 z-30 group"><button type="button" onClick={() => focusedTask && setFocusOpen(true)} className="flex items-center gap-1 text-sm text-white/80 transition hover:text-white disabled:cursor-default disabled:opacity-60" aria-label="Focus mode" disabled={!focusedTask}><FocusIcon className="size-6" /></button><span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[11px] text-white/80 opacity-0 transition group-hover:opacity-100">{focusedTask ? 'Resume focus mode' : 'Start a task from Tasks'}</span></div>
    <div className="fixed right-8 top-8 z-30 flex gap-3"><RoundButton label="Calendar"><CalendarIcon className="size-5" /></RoundButton><RoundButton label="Weather"><CloudIcon className="size-5" /></RoundButton></div>
    <TopSites />
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pb-24 text-center">
      <Clock />
      <h1 className="mt-12 font-normal leading-none tracking-[-.045em] text-white drop-shadow-[0_5px_25px_rgba(0,0,0,.24)] text-[clamp(38px,4.4vw,82px)]">{greeting}, {name}</h1>
      {dailyGoalTasks.length > 0 && <div className="mt-5 flex max-w-[min(88vw,960px)] flex-wrap justify-center gap-2">{dailyGoalTasks.map(task => <button key={task.id} type="button" onClick={() => { setTasksOpen(true); setTasksExpanded(true) }} className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur transition hover:bg-black/35"><span className="mr-2 text-white/50">Daily goal</span>{task.title}</button>)}</div>}
      <button onClick={() => setIndex(value => value + 1)} title="Click để đổi mantra" style={{ fontSize: 'clamp(22px, 2.6vw, 42px)' }} className="mt-7 max-w-[min(88vw,1200px)] cursor-pointer font-semibold leading-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.3)] transition hover:opacity-80">{mantra}</button>
    </section>
    <button onClick={() => setSettingsOpen(true)} className="luxe-glass-action fixed bottom-6 left-20 z-30 flex size-10 items-center justify-center rounded-full text-white/85" aria-label="Mở cài đặt"><SlidersHorizontalIcon className="size-5" /></button>
    <button onClick={() => setQuoteIndex(value => value + 1)} title="Click để đổi quote" className="fixed bottom-7 left-1/2 z-20 w-[70vw] -translate-x-1/2 text-center text-[clamp(13px,1.25vw,22px)] font-semibold text-white drop-shadow-md transition hover:opacity-80">{quote}</button>
    <div className="fixed bottom-7 right-8 z-30 flex flex-col items-end gap-2"><span className="text-sm font-semibold">Tasks</span><div className="flex gap-3"><RoundButton label={tasksOpen ? 'Đóng tasks' : 'Mở tasks'} onClick={() => setTasksOpen(value => { const next = !value; if (!next) setTasksExpanded(false); return next })}><SquareCheckBigIcon className="size-5" /></RoundButton></div></div>
    <NotesPanel open={notesOpen} onToggle={() => setNotesOpen(value => !value)} onClose={() => setNotesOpen(false)}/>
    {tasksOpen && <div className="fixed bottom-20 right-6 z-40"><TaskList tasks={tasks} collections={taskCollections} showCompletedTasks={settings.showCompletedTasks} expanded={tasksExpanded} dailyGoalTaskIds={dailyGoalTasks.map(task => task.id)} onChange={updateTasks} onCollectionsChange={updateTaskCollections} onToggleCompleted={toggleCompleted} onStartFocus={startFocus} onSetDailyGoal={setTaskDailyGoal} onExpandedChange={setTasksExpanded}/></div>}
    <SettingsModal open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSettings={updateSettings} onLarkTasks={updateTasks}/>
    {focusOpen && focusedTask && <FocusModeOverlay task={focusedTask} session={focusSession!} onEnd={endFocus} />}
  </main>
}
