import { useEffect, useMemo, useRef, useState } from 'react'
import { GripHorizontalIcon, Maximize2Icon, Minimize2Icon, PaletteIcon, PlusIcon, SearchIcon, ToggleLeftIcon, ToggleRightIcon, TrashIcon, XIcon } from './Icons'

type NoteColor = 'mint' | 'blush' | 'stone' | 'sky' | 'amber'
type NoteTheme = 'blur' | 'color'
type Note = {
  id: string
  title: string
  content: string
  updatedAt: string
  color?: NoteColor
  theme?: NoteTheme
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}
type Props = { open: boolean; onClose(): void }

// Exact palette and color/blur modes recovered from modules 15387 and y8.
const noteColors: Record<NoteColor, { panel: string; note: string; toolbar: string }> = {
  mint: { panel: 'bg-emerald-100/90 text-emerald-950 border-emerald-200', note: 'bg-emerald-100 text-emerald-950 border-emerald-200', toolbar: 'text-emerald-700' },
  blush: { panel: 'bg-rose-100/90 text-rose-950 border-rose-200', note: 'bg-rose-100 text-rose-950 border-rose-200', toolbar: 'text-rose-700' },
  stone: { panel: 'bg-slate-100/90 text-slate-900 border-slate-200', note: 'bg-slate-100 text-slate-900 border-slate-200', toolbar: 'text-slate-700' },
  sky: { panel: 'bg-sky-100/90 text-sky-950 border-sky-200', note: 'bg-sky-100 text-sky-950 border-sky-200', toolbar: 'text-sky-700' },
  amber: { panel: 'bg-amber-100/90 text-amber-950 border-amber-200', note: 'bg-amber-100 text-amber-950 border-amber-200', toolbar: 'text-amber-700' },
}
const colorOrder: NoteColor[] = ['mint', 'blush', 'stone', 'sky', 'amber']
const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'H2', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'P', 'BR', 'DIV'])

function isPosition(value: unknown): value is { x: number; y: number } { return Boolean(value) && typeof value === 'object' && Number.isFinite((value as { x?: number }).x) && Number.isFinite((value as { y?: number }).y) }
function isSize(value: unknown): value is { width: number; height: number } { return Boolean(value) && typeof value === 'object' && Number.isFinite((value as { width?: number }).width) && Number.isFinite((value as { height?: number }).height) }

function readNotes(): Note[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem('dbindex_notes') || localStorage.getItem('luxe_notes') || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((note): note is Record<string, unknown> => Boolean(note) && typeof note === 'object' && typeof note.id === 'string').map((note, index) => ({
      id: String(note.id), title: typeof note.title === 'string' ? note.title : 'Untitled', content: typeof note.content === 'string' ? note.content : '',
      updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : new Date().toISOString(), color: colorOrder.includes(note.color as NoteColor) ? note.color as NoteColor : colorOrder[index % colorOrder.length],
      theme: note.theme === 'color' ? 'color' : 'blur', position: isPosition(note.position) ? note.position : undefined, size: isSize(note.size) ? note.size : undefined,
    }))
  } catch { return [] }
}

function writeNotes(notes: Note[]) { const value = JSON.stringify(notes); localStorage.setItem('dbindex_notes', value); localStorage.setItem('luxe_notes', value) }

function sanitizeNoteHtml(value: string) {
  if (typeof DOMParser === 'undefined') return value.replace(/<[^>]*>/g, '')
  const parsed = new DOMParser().parseFromString(value, 'text/html')
  const output = document.createElement('div')
  const appendSafe = (target: HTMLElement, node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { target.appendChild(document.createTextNode(node.textContent ?? '')); return }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const element = node as HTMLElement
    if (!allowedTags.has(element.tagName)) { Array.from(element.childNodes).forEach(child => appendSafe(target, child)); return }
    const clean = document.createElement(element.tagName.toLowerCase())
    Array.from(element.childNodes).forEach(child => appendSafe(clean, child))
    target.appendChild(clean)
  }
  Array.from(parsed.body.childNodes).forEach(node => appendSafe(output, node))
  return output.innerHTML
}

function plainText(value: string) {
  if (typeof DOMParser === 'undefined') return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return new DOMParser().parseFromString(value, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function defaultPosition(index: number) { return { x: Math.min(120 + 24 * index, Math.max(80, window.innerWidth - 460)), y: Math.min(120 + 24 * index, Math.max(80, window.innerHeight - 520)) } }

function NoteEditor({ note, onClose, onUpdate, onDelete, onCycleColor }: { note: Note; onClose(): void; onUpdate(id: string, patch: Partial<Note>): void; onDelete(id: string): void; onCycleColor(id: string): void }) {
  const frameRef = useRef<HTMLElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(() => note.position ?? defaultPosition(0))
  const [collapsed, setCollapsed] = useState(false)
  const [toolbarVersion, setToolbarVersion] = useState(0)
  const palette = noteColors[note.color ?? 'mint']
  const isColor = note.theme === 'color'

  useEffect(() => { if (editorRef.current) editorRef.current.innerHTML = sanitizeNoteHtml(note.content) }, [note.id])

  const saveContent = () => onUpdate(note.id, { content: sanitizeNoteHtml(editorRef.current?.innerHTML ?? '') })
  const runCommand = (command: string, value?: string) => { editorRef.current?.focus(); document.execCommand(command, false, value); saveContent(); setToolbarVersion(version => version + 1) }
  const isActive = (key: string) => {
    // Read toolbarVersion so selection changes refresh the active button styling.
    void toolbarVersion
    const editor = editorRef.current
    if (!editor || !editor.contains(document.getSelection()?.anchorNode ?? null)) return false
    if (key === 'bold') return document.queryCommandState('bold')
    if (key === 'italic') return document.queryCommandState('italic')
    if (key === 'underline') return document.queryCommandState('underline')
    if (key === 'strike') return document.queryCommandState('strikeThrough')
    if (key === 'bullet') return document.queryCommandState('insertUnorderedList')
    if (key === 'ordered') return document.queryCommandState('insertOrderedList')
    const block = document.queryCommandValue('formatBlock').replace(/[<>]/g, '').toLowerCase()
    return key === 'h2' ? block === 'h2' : key === 'quote' ? block === 'blockquote' : key === 'code' ? block === 'pre' : false
  }
  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button, input')) return
    const origin = position
    const pointerX = event.clientX
    const pointerY = event.clientY
    const move = (moveEvent: PointerEvent) => setPosition({ x: Math.max(0, origin.x + moveEvent.clientX - pointerX), y: Math.max(0, origin.y + moveEvent.clientY - pointerY) })
    const stop = (upEvent: PointerEvent) => { onUpdate(note.id, { position: { x: Math.max(0, origin.x + upEvent.clientX - pointerX), y: Math.max(0, origin.y + upEvent.clientY - pointerY) } }); window.removeEventListener('pointermove', move) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }
  const rememberSize = () => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || collapsed) return
    const size = { width: Math.round(rect.width), height: Math.round(rect.height) }
    if (size.width !== note.size?.width || size.height !== note.size?.height) onUpdate(note.id, { size })
  }
  const controls = [
    ['bold', 'B', 'Bold', () => runCommand('bold')],
    ['italic', 'I', 'Italic', () => runCommand('italic')],
    ['underline', 'U', 'Underline', () => runCommand('underline')],
    ['strike', 'S', 'Strikethrough', () => runCommand('strikeThrough')],
    ['h2', 'H2', 'Heading 2', () => runCommand('formatBlock', 'H2')],
    ['bullet', '•', 'Bulleted list', () => runCommand('insertUnorderedList')],
    ['ordered', '1.', 'Numbered list', () => runCommand('insertOrderedList')],
    ['quote', '“', 'Block quote', () => runCommand('formatBlock', 'BLOCKQUOTE')],
    ['code', '</>', 'Code block', () => runCommand('formatBlock', 'PRE')],
    ['clear', '⌫', 'Clear formatting', () => { runCommand('removeFormat'); runCommand('formatBlock', 'DIV') }],
  ] as const

  return <section ref={frameRef} onMouseUp={rememberSize} className={`fixed z-50 min-h-[120px] min-w-[280px] max-w-[90vw] overflow-hidden rounded-[20px] border shadow-[0_24px_64px_rgba(0,0,0,.28)] ${isColor ? palette.note : 'border-white/35 bg-white/20 text-slate-900 backdrop-saturate-200 backdrop-blur-2xl'}`} style={{ left: position.x, top: position.y, width: note.size?.width ?? 420, height: collapsed ? 'auto' : note.size?.height ?? 520, resize: collapsed ? 'none' : 'both' }}>
    <header onPointerDown={startDrag} className="flex cursor-move items-center justify-between gap-2 px-4 py-3"><div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold"><GripHorizontalIcon className={`size-4 shrink-0 ${palette.toolbar}`} /><input value={note.title} onChange={event => onUpdate(note.id, { title: event.target.value })} placeholder="Untitled" className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-500" /></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setCollapsed(value => !value)} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label={collapsed ? 'Mở rộng note' : 'Thu gọn note'} title={collapsed ? 'Mở rộng note' : 'Thu gọn note'}>{collapsed ? <Maximize2Icon className="size-4" /> : <Minimize2Icon className="size-4" />}</button><button type="button" onClick={() => onUpdate(note.id, { theme: isColor ? 'blur' : 'color' })} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Đổi nền note" title="Đổi nền note">{isColor ? <ToggleLeftIcon className="size-4" /> : <ToggleRightIcon className="size-4" />}</button>{isColor && <button type="button" onClick={() => onCycleColor(note.id)} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Đổi màu note" title="Đổi màu note"><PaletteIcon className="size-4" /></button>}<button type="button" onClick={() => onDelete(note.id)} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Xóa note" title="Xóa note"><TrashIcon className="size-4" /></button><button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Đóng note" title="Đóng note"><XIcon className="size-4" /></button></div></header>
    {!collapsed && <div className="h-[calc(100%-3.25rem)] px-4 pb-4"><div className="note-editor flex h-full flex-col overflow-hidden rounded-xl rounded-t-none border border-black/10 bg-white/60"><div role="toolbar" aria-label="Note formatting" className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-white/60 px-2 py-2">{controls.map(([key, glyph, label, onClick]) => <button key={key} type="button" onMouseDown={event => event.preventDefault()} onClick={onClick} className={`inline-flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-md border border-black/10 px-2 text-xs font-semibold text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700/25 ${isActive(key) ? 'bg-white shadow-sm' : 'bg-white/30 hover:bg-white/70'}`} aria-label={label} title={label} aria-pressed={isActive(key)}>{glyph}</button>)}</div><div ref={editorRef} contentEditable suppressContentEditableWarning onInput={saveContent} onKeyUp={() => setToolbarVersion(version => version + 1)} onMouseUp={() => setToolbarVersion(version => version + 1)} className="note-editor__content min-h-[220px] flex-1 overflow-auto px-3 py-2 text-sm text-slate-900 outline-none" /></div></div>}
  </section>
}

export function NotesPanel({ open, onClose }: Props) {
  const [notes, setNotes] = useState<Note[]>(readNotes)
  const [search, setSearch] = useState('')
  const [openNoteIds, setOpenNoteIds] = useState<string[]>(() => { try { const value: unknown = JSON.parse(localStorage.getItem('luxe_open_sticky_notes') || '[]'); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [] } catch { return [] } })
  const visible = useMemo(() => notes.filter(note => `${note.title} ${plainText(note.content)}`.toLowerCase().includes(search.toLowerCase())), [notes, search])
  const openNotes = useMemo(() => openNoteIds.map(id => notes.find(note => note.id === id)).filter((note): note is Note => Boolean(note)), [notes, openNoteIds])
  const persist = (next: Note[]) => { setNotes(next); writeNotes(next) }
  const update = (id: string, patch: Partial<Note>) => persist(notes.map(note => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
  const openEditor = (id: string) => setOpenNoteIds(current => { const next = [...current.filter(noteId => noteId !== id), id]; localStorage.setItem('luxe_open_sticky_notes', JSON.stringify(next)); return next })
  const closeEditor = (id: string) => setOpenNoteIds(current => { const next = current.filter(noteId => noteId !== id); localStorage.setItem('luxe_open_sticky_notes', JSON.stringify(next)); return next })
  const create = () => { const note: Note = { id: crypto.randomUUID(), title: 'Untitled', content: '', updatedAt: new Date().toISOString(), color: colorOrder[notes.length % colorOrder.length], theme: 'blur', position: defaultPosition(notes.length) }; persist([note, ...notes]); openEditor(note.id) }
  const deleteNote = (id: string) => { persist(notes.filter(note => note.id !== id)); closeEditor(id) }
  const cycleColor = (id: string) => { const note = notes.find(item => item.id === id); if (!note) return; const current = colorOrder.indexOf(note.color ?? 'mint'); update(id, { color: colorOrder[(current + 1) % colorOrder.length] }) }

  return <>{open && <section className="luxe-note-surface fixed bottom-20 right-6 z-40 w-[320px] max-w-[calc(100vw-3rem)] rounded-[20px] border border-white/15 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,.7)]"><header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2"><h3 className="text-sm font-semibold">My Notes</h3><span className="luxe-glass-surface rounded-full px-2 py-0.5 text-xs text-white/70">{visible.length}</span></div><div className="flex items-center gap-1"><button type="button" onClick={create} className="luxe-glass-surface inline-flex size-8 items-center justify-center rounded-full text-white/80 transition hover:bg-black/10" aria-label="Tạo note"><PlusIcon className="size-4" /></button><button type="button" onClick={onClose} className="luxe-glass-surface inline-flex size-8 items-center justify-center rounded-full text-white/70 transition hover:bg-black/10" aria-label="Đóng notes"><XIcon className="size-4" /></button></div></header><div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2"><SearchIcon className="size-4 shrink-0 text-white/45" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notes..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" /></div><div className="max-h-[60vh] space-y-3 overflow-y-auto p-3">{visible.map((note, index) => <button key={note.id} type="button" onClick={() => openEditor(note.id)} className={`w-full rounded-[16px] border px-3 py-2 text-left transition ${noteColors[note.color ?? colorOrder[index % colorOrder.length]].panel} ${openNoteIds.includes(note.id) ? 'ring-2 ring-white/70' : 'hover:ring-2 hover:ring-white/30'}`}><h4 className="text-sm font-semibold">{note.title || 'Untitled'}</h4><p className="mt-1 max-h-12 overflow-hidden text-xs opacity-80">{plainText(note.content) || 'No content yet'}</p><p className="mt-2 text-[11px] opacity-70">{new Date(note.updatedAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</p></button>)}{!visible.length && <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">{notes.length ? 'No matching notes.' : 'Create your first note.'}</div>}</div></section>}{openNotes.map(note => <NoteEditor key={note.id} note={note} onClose={() => closeEditor(note.id)} onUpdate={update} onDelete={deleteNote} onCycleColor={cycleColor} />)}</>
}
