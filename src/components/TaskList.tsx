import { useMemo, useState } from 'react'
import type { Task } from '../types'
import { CheckIcon, ChevronDownIcon, Maximize2Icon, Minimize2Icon, MoreHorizontalIcon, PlusIcon, SunIcon } from './Icons'

type Props = {
  tasks: Task[]
  showCompletedTasks: boolean
  expanded: boolean
  onChange(tasks: Task[]): void
  onToggleCompleted(): void
  onExpandedChange(expanded: boolean): void
}

export function TaskList({ tasks, showCompletedTasks, expanded, onChange, onToggleCompleted, onExpandedChange }: Props) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const visible = useMemo(() => showCompletedTasks ? tasks : tasks.filter(task => !task.done), [tasks, showCompletedTasks])
  const toggle = (id: string) => onChange(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task))
  const beginEdit = (task: Task) => { setEditingId(task.id); setEditingTitle(task.title) }
  const commitEdit = () => {
    if (!editingId) return
    const title = editingTitle.trim()
    if (title) onChange(tasks.map(task => task.id === editingId ? { ...task, title } : task))
    setEditingId(null)
    setEditingTitle('')
  }
  const cancelEdit = () => { setEditingId(null); setEditingTitle('') }
  const add = (value = draft) => {
    const title = value.trim()
    if (!title) return
    onChange([...tasks, { id: crypto.randomUUID(), title, done: false, source: 'local' }])
    setDraft('')
  }

  // Recovered from legacy c7: compact is 526 × 172 px and shows three Today tasks;
  // expanded is 50vw × 50vh and returns to compact using the collapse control.
  const panelSize = expanded
    ? 'h-[50vh] w-[50vw] max-h-[calc(100vh-32px)] max-w-[calc(100vw-32px)] rounded-[12px]'
    : 'w-[526px] max-w-[calc(100vw-32px)] rounded-[10px]'
  const shown = visible

  return <section className={`luxe-glass-surface luxe-glass-surface--panel luxe-glass-surface--dark-panel overflow-hidden text-white shadow-[0_28px_80px_rgba(0,0,0,.48)] transition-[width,height,border-radius] duration-300 ease-out ${panelSize}`}>
    {expanded ? <div className="luxe-task-surface-content grid h-full grid-cols-[286px_minmax(0,1fr)] bg-[radial-gradient(circle_at_88%_96%,rgba(14,29,37,.68),transparent_38%),radial-gradient(circle_at_28%_12%,rgba(70,49,42,.36),transparent_42%),linear-gradient(145deg,rgba(43,31,28,.96),rgba(28,25,25,.96)_38%,rgba(12,17,22,.98))] max-md:grid-cols-1">
      <TaskSidebar taskCount={visible.length} completedCount={tasks.filter(task => task.done).length} />
      <section className="flex min-h-0 flex-col">
        <TaskHeader expanded onExpand={() => onExpandedChange(false)} onToggleCompleted={onToggleCompleted} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4"><TaskRows tasks={shown} toggle={toggle} editingId={editingId} editingTitle={editingTitle} onEditTitleChange={setEditingTitle} onEditStart={beginEdit} onEditCommit={commitEdit} onEditCancel={cancelEdit} emptyClass="flex h-full items-center justify-center" /></div>
        <TaskInput draft={draft} setDraft={setDraft} add={add} expanded />
      </section>
    </div> : <div className="relative flex max-h-[calc(100vh-32px)] flex-col bg-[radial-gradient(circle_at_94%_110%,rgba(18,33,40,.7),transparent_45%),radial-gradient(circle_at_18%_0%,rgba(61,45,39,.34),transparent_36%),linear-gradient(135deg,rgba(16,18,20,.98),rgba(18,16,17,.95)_52%,rgba(13,16,20,.98))] px-7 py-6">
      <TaskHeader expanded={false} onExpand={() => onExpandedChange(true)} onToggleCompleted={onToggleCompleted} />
      <div className="max-h-[calc(100vh-160px)] overflow-y-auto overscroll-contain space-y-2 pr-1"><TaskRows tasks={shown} toggle={toggle} editingId={editingId} editingTitle={editingTitle} onEditTitleChange={setEditingTitle} onEditStart={beginEdit} onEditCommit={commitEdit} onEditCancel={cancelEdit} compact /></div>
      <div className="mt-2 shrink-0"><TaskInput draft={draft} setDraft={setDraft} add={add} /></div>
    </div>}
  </section>
}

function TaskHeader({ expanded, onExpand, onToggleCompleted }: { expanded: boolean; onExpand(): void; onToggleCompleted(): void }) {
  const [optionsOpen, setOptionsOpen] = useState(false)
  return <header className={`relative flex items-center justify-between gap-4 ${expanded ? 'px-7 py-6' : 'mb-4'}`}>
    <button type="button" onClick={() => !expanded && onExpand()} className="flex min-w-0 items-center gap-4 rounded-none border-0 text-left outline-none transition hover:text-white/90" title={expanded ? undefined : 'Phóng to tasks'}>
      <SunIcon className="size-6 shrink-0 text-white/90" /><span className={`truncate font-semibold leading-none tracking-[-.025em] ${expanded ? 'text-[calc(22px*var(--task-font-scale,0.88))]' : 'text-[calc(20px*var(--task-font-scale,0.88))]'}`}>Today's tasks</span><ChevronDownIcon className="size-4 shrink-0 text-white/45" />
    </button>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setOptionsOpen(value => !value)} className={`flex ${expanded ? 'size-8' : 'size-8'} items-center justify-center rounded-full text-white/62 transition hover:bg-white/10 hover:text-white`} title="Tùy chọn tasks" aria-label="Tùy chọn tasks"><MoreHorizontalIcon className="size-5" /></button>
      <button type="button" onClick={onExpand} className={`flex items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white ${expanded ? 'size-9' : 'size-8'}`} title={expanded ? 'Thu gọn tasks' : 'Phóng to tasks'} aria-label={expanded ? 'Thu gọn tasks' : 'Phóng to tasks'}>{expanded ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}</button>
    </div>
    {optionsOpen && <div className="absolute right-8 top-full z-10 w-[250px] rounded-[14px] border border-white/10 bg-[#302d2c]/[.98] p-2 text-[calc(14px*var(--task-font-scale,0.88))] shadow-[0_18px_42px_rgba(0,0,0,.36)] backdrop-blur-xl"><button type="button" onClick={() => { onToggleCompleted(); setOptionsOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold text-white/85 transition hover:bg-white/10"><span className="flex size-4 items-center justify-center rounded border border-white/35">✓</span>Ẩn/hiện task đã hoàn thành</button></div>}
  </header>
}

function TaskRows({ tasks, toggle, editingId, editingTitle, onEditTitleChange, onEditStart, onEditCommit, onEditCancel, compact = false, emptyClass = '' }: { tasks: Task[]; toggle(id: string): void; editingId: string | null; editingTitle: string; onEditTitleChange(value: string): void; onEditStart(task: Task): void; onEditCommit(): void; onEditCancel(): void; compact?: boolean; emptyClass?: string }) {
  if (!tasks.length) return <p className={`${emptyClass} text-[15px] font-semibold leading-6 text-white/38`}>Chưa có task nào.</p>
  return <>{tasks.map(task => <p key={task.id} onDoubleClick={() => editingId !== task.id && onEditStart(task)} className={`group flex cursor-pointer items-center gap-3 transition ${compact ? 'rounded-2xl py-1 pl-4' : 'min-h-12 rounded-2xl border border-transparent px-4 py-2 hover:border-white/10 hover:bg-white/[.045]'}`}>
    <button aria-label={`Hoàn thành ${task.title}`} type="button" role="checkbox" aria-checked={task.done} onClick={() => toggle(task.id)} onDoubleClick={event => event.stopPropagation()} className={`flex size-[22px] shrink-0 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-white/25 ${task.done ? 'border-white/35 bg-white/90 text-slate-950' : 'border-white/35 bg-white/[.03] text-transparent hover:border-white/60 hover:bg-white/10'}`}>{task.done && <CheckIcon className="size-3.5" />}</button>
    {!compact && <span className="text-white/45">⠿</span>}
    {editingId === task.id ? <input autoFocus value={editingTitle} onChange={event => onEditTitleChange(event.target.value)} onBlur={onEditCommit} onDoubleClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Enter') onEditCommit(); if (event.key === 'Escape') onEditCancel() }} className={`min-w-0 flex-1 border-b border-white/20 bg-transparent pb-1 font-semibold text-white outline-none placeholder:text-white/35 focus:border-white/50 ${compact ? 'text-[calc(17px*var(--task-font-scale,0.88))] leading-6' : 'text-[calc(16px*var(--task-font-scale,0.88))] leading-6'}`} aria-label="Sửa tên task" /> : <span className={task.done ? `min-w-0 flex-1 truncate font-semibold text-white/45 line-through ${compact ? 'text-[calc(17px*var(--task-font-scale,0.88))] leading-6' : 'text-[calc(16px*var(--task-font-scale,0.88))] leading-6'}` : `min-w-0 flex-1 truncate font-semibold ${compact ? 'text-[calc(17px*var(--task-font-scale,0.88))] leading-6' : 'text-[calc(16px*var(--task-font-scale,0.88))] leading-6'}`}>{task.title}</span>}
    {!compact && <span className="text-sm font-semibold text-white/35">{task.source === 'lark' ? 'LARK' : ''}</span>}
  </p>)}</>
}

function TaskSidebar({ taskCount, completedCount }: { taskCount: number; completedCount: number }) {
  // The 286px navigation rail is present in the expanded `c7` source. Views beyond
  // Today are intentionally visual only until the remaining task data model is ported.
  return <aside className="flex min-h-0 flex-col border-r border-white/10 px-6 py-6 max-md:hidden"><div className="mb-8 flex items-center gap-3"><SunIcon className="size-6 text-white/90" /><span className="text-[22px] font-semibold leading-none tracking-[-.025em]">Tasks</span><ChevronDownIcon className="size-4 text-white/45" /></div><nav className="space-y-2"><TaskView label="Today" count={taskCount} active /><TaskView label="Upcoming" count={0} /><TaskView label="Inbox" count={0} /><TaskView label="Completed" count={completedCount} /></nav></aside>
}

function TaskView({ label, count, active = false }: { label: string; count: number; active?: boolean }) {
  return <button type="button" className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[16px] font-semibold transition ${active ? 'bg-white/13 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]' : 'text-white/88 hover:bg-white/8'}`}><span className="size-5 rounded-md border border-current/40" /><span className="min-w-0 flex-1 truncate">{label}</span><span className="text-[16px] tabular-nums text-white/42">{count}</span></button>
}

function TaskInput({ draft, setDraft, add, expanded = false }: { draft: string; setDraft(value: string): void; add(value?: string): void; expanded?: boolean }) {
  return <div className={`flex items-center gap-3 ${expanded ? 'border-t border-white/10 px-7 py-5' : 'px-0 pt-2'}`}>
    <PlusIcon className={expanded ? 'size-5 shrink-0 text-white/45' : 'size-5 shrink-0 text-white/45'} />
    <input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
      if (event.key !== 'Enter' || event.repeat || event.nativeEvent.isComposing) return
      event.preventDefault()
      add(event.currentTarget.value)
    }} placeholder="Thêm task" aria-label="Thêm task" className={`min-w-0 flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-white/42 ${expanded ? 'text-[calc(17px*var(--task-font-scale,0.88))] leading-6' : 'text-[calc(16px*var(--task-font-scale,0.88))] leading-6'}`} />
    {expanded && <button type="button" onClick={() => add()} className="luxe-glass-surface luxe-glass-surface--action h-9 rounded-full px-3 text-[13px] font-semibold text-white">Thêm</button>}
  </div>
}
