import { useEffect, useMemo, useRef, useState } from 'react'
import { FileIcon, GripHorizontalIcon, Maximize2Icon, Minimize2Icon, PaletteIcon, PlusIcon, SearchIcon, ToggleLeftIcon, ToggleRightIcon, TrashIcon, XIcon } from './Icons'
import { formatDateTime } from '../dateFormat'

type NoteColor = 'mint' | 'blush' | 'stone' | 'sky' | 'amber'
type NoteTheme = 'blur' | 'color'
type InlineMark = 'bold' | 'italic' | 'underline' | 'strike'
type InlineMarkState = Record<InlineMark, boolean>
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
type Props = { open: boolean; onClose(): void; onToggle(): void }

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
  const inlineMarkStateRef = useRef<InlineMarkState | null>(null)
  const palette = noteColors[note.color ?? 'mint']
  const isColor = note.theme === 'color'

  useEffect(() => { if (editorRef.current) editorRef.current.innerHTML = sanitizeNoteHtml(note.content) }, [note.id])

  const saveContent = () => onUpdate(note.id, { content: sanitizeNoteHtml(editorRef.current?.innerHTML ?? '') })
  const readInlineMarkState = (node: Node | null): InlineMarkState => {
    const element = node instanceof Element ? node : node?.parentElement
    const inside = (selector: string) => Boolean(element?.closest(selector) && editorRef.current?.contains(element.closest(selector)))
    return { bold: inside('b, strong'), italic: inside('i, em'), underline: inside('u'), strike: inside('s, strike') }
  }
  const moveCaretOutsideInlineMarks = (editor: HTMLElement, selection: Selection) => {
    // Split each inline wrapper at the insertion point, from innermost outward.
    // This prevents the browser's previous typing style from leaking back in.
    for (let depth = 0; depth < 8; depth += 1) {
      const anchor = selection.anchorNode
      const element = anchor instanceof Element ? anchor : anchor?.parentElement
      const mark = element?.closest('b, strong, i, em, u, s, strike') as HTMLElement | null | undefined
      if (!mark || !editor.contains(mark) || !mark.parentNode) break
      const split = document.createRange()
      split.setStart(selection.anchorNode!, selection.anchorOffset)
      split.setEnd(mark, mark.childNodes.length)
      const trailing = split.extractContents()
      mark.after(trailing)
      const caret = document.createRange()
      caret.setStartAfter(mark)
      caret.collapse(true)
      selection.removeAllRanges()
      selection.addRange(caret)
    }
  }
  const refreshCaretMarkState = () => {
    const editor = editorRef.current
    const selection = document.getSelection()
    if (!editor || !selection?.isCollapsed || !editor.contains(selection.anchorNode)) return
    inlineMarkStateRef.current = null
    setToolbarVersion(version => version + 1)
  }
  const refreshSelectionToolbar = () => {
    const selection = document.getSelection()
    if (selection?.isCollapsed) inlineMarkStateRef.current = null
    setToolbarVersion(version => version + 1)
  }
  const handleBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    const input = event.nativeEvent as InputEvent
    const editor = editorRef.current
    const selection = document.getSelection()
    const marks = inlineMarkStateRef.current
    if (input.inputType !== 'insertText' || !input.data || !marks || !editor || !selection?.isCollapsed || !editor.contains(selection.anchorNode)) return
    event.preventDefault()
    const text = document.createTextNode(input.data)
    const wrappers: Array<[InlineMark, string]> = [['bold', 'b'], ['italic', 'i'], ['underline', 'u'], ['strike', 's']]
    let content: Node = text
    wrappers.forEach(([key, tag]) => {
      if (!marks[key]) return
      const wrapper = document.createElement(tag)
      wrapper.appendChild(content)
      content = wrapper
    })
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(content)
    const caret = document.createRange()
    caret.setStartAfter(content)
    caret.collapse(true)
    selection.removeAllRanges()
    selection.addRange(caret)
    saveContent()
  }
  const runCommand = (command: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return
    const selection = document.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null
    const rangeIsInsideEditor = Boolean(range && editor.contains(range.commonAncestorContainer))
    const collapsed = Boolean(range?.collapsed)
    editor.focus()
    if (selection && range && rangeIsInsideEditor) { selection.removeAllRanges(); selection.addRange(range) }
    const inlineKey: InlineMark | null = command === 'bold' ? 'bold'
      : command === 'italic' ? 'italic'
      : command === 'underline' ? 'underline'
      : command === 'strikeThrough' ? 'strike' : null
    if (collapsed && rangeIsInsideEditor && inlineKey && selection) {
      const current = inlineMarkStateRef.current ?? readInlineMarkState(selection.anchorNode)
      inlineMarkStateRef.current = { ...current, [inlineKey]: !current[inlineKey] }
      moveCaretOutsideInlineMarks(editor, selection)
      saveContent()
      setToolbarVersion(version => version + 1)
      return
    }
    const inlineMark = command === 'bold' ? 'b, strong'
      : command === 'italic' ? 'i, em'
      : command === 'underline' ? 'u'
      : command === 'strikeThrough' ? 's, strike' : null
    const anchor = selection?.anchorNode
    const anchorElement = anchor instanceof Element ? anchor : anchor?.parentElement
    const activeBefore = Boolean(inlineMark && (anchorElement?.closest(inlineMark) || document.queryCommandState(command)))
    document.execCommand(command, false, value)
    if (!collapsed && inlineKey) inlineMarkStateRef.current = null
    // Some contentEditable engines leave the caret inside the old mark after
    // execCommand toggles it off. Split that mark at the caret so subsequent
    // typing is genuinely unformatted while preserving the preceding text.
    let splitInlineMark = false
    if (collapsed && activeBefore && inlineMark && selection?.isCollapsed) {
      const currentAnchor = selection.anchorNode
      const currentElement = currentAnchor instanceof Element ? currentAnchor : currentAnchor?.parentElement
      const mark = currentElement?.closest(inlineMark) as HTMLElement | null | undefined
      if (mark && mark.contains(selection.anchorNode) && editor.contains(mark) && mark.parentNode) {
        const split = document.createRange()
        split.setStart(selection.anchorNode!, selection.anchorOffset)
        split.setEnd(mark, mark.childNodes.length)
        const trailing = split.extractContents()
        mark.after(trailing)
        const caret = document.createRange()
        caret.setStartAfter(mark)
        caret.collapse(true)
        selection.removeAllRanges()
        selection.addRange(caret)
        splitInlineMark = true
      }
    }
    if (!collapsed || splitInlineMark || !['bold', 'italic', 'underline', 'strikeThrough'].includes(command)) saveContent()
    setToolbarVersion(version => version + 1)
  }
  const clearFormatting = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    editor.querySelectorAll('h2, blockquote, pre').forEach(element => {
      const paragraph = document.createElement('div')
      while (element.firstChild) paragraph.appendChild(element.firstChild)
      element.replaceWith(paragraph)
    })
    editor.querySelectorAll('ul, ol').forEach(list => {
      const lines = document.createDocumentFragment()
      Array.from(list.children).forEach(item => {
        const line = document.createElement('div')
        while (item.firstChild) line.appendChild(item.firstChild)
        lines.appendChild(line)
      })
      list.replaceWith(lines)
    })
    editor.querySelectorAll('b, strong, i, em, u, s, strike, code').forEach(element => element.replaceWith(...Array.from(element.childNodes)))
    saveContent()
    setToolbarVersion(version => version + 1)
  }
  const isActive = (key: string) => {
    // Read toolbarVersion so selection changes refresh the active button styling.
    void toolbarVersion
    const editor = editorRef.current
    if (!editor || !editor.contains(document.getSelection()?.anchorNode ?? null)) return false
    const selectionNode = document.getSelection()?.anchorNode
    const selectionElement = selectionNode instanceof Element ? selectionNode : selectionNode?.parentElement
    const hasMark = (selector: string) => Boolean(selectionElement?.closest(selector) && editor.contains(selectionElement.closest(selector)))
    const selection = document.getSelection()
    const inHeading = Boolean(selectionElement?.closest('h1, h2, h3, h4, h5, h6'))
    const activeMark = (selector: string, command: string) => selection?.isCollapsed
      ? document.queryCommandState(command)
      : hasMark(selector) || document.queryCommandState(command)
    if (selection?.isCollapsed && inlineMarkStateRef.current && (key === 'bold' || key === 'italic' || key === 'underline' || key === 'strike')) return inlineMarkStateRef.current[key]
    if (key === 'bold') return inHeading && selection?.isCollapsed
      ? hasMark('b, strong') && document.queryCommandState('bold')
      : activeMark('b, strong', 'bold')
    if (key === 'italic') return activeMark('i, em', 'italic')
    if (key === 'underline') return activeMark('u', 'underline')
    if (key === 'strike') return activeMark('s, strike', 'strikeThrough')
    if (key === 'bullet') return document.queryCommandState('insertUnorderedList')
    if (key === 'ordered') return document.queryCommandState('insertOrderedList')
    const block = document.queryCommandValue('formatBlock').replace(/[<>]/g, '').toLowerCase()
    return key === 'h2' ? block === 'h2' : key === 'quote' ? block === 'blockquote' : key === 'code' ? block === 'pre' : false
  }
  const toggleBlockFormat = (tag: string) => {
    const currentBlock = document.queryCommandValue('formatBlock').replace(/[<>]/g, '').toLowerCase()
    runCommand('formatBlock', currentBlock === tag.toLowerCase() ? 'P' : tag)
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
    ['h2', 'H2', 'Heading 2', () => toggleBlockFormat('H2')],
    ['bullet', '•', 'Bulleted list', () => runCommand('insertUnorderedList')],
    ['ordered', '1.', 'Numbered list', () => runCommand('insertOrderedList')],
    ['quote', '“', 'Block quote', () => toggleBlockFormat('BLOCKQUOTE')],
    ['code', '</>', 'Code block', () => toggleBlockFormat('PRE')],
    ['clear', '⌫', 'Clear formatting', clearFormatting],
  ] as const

  return <section ref={frameRef} onMouseUp={rememberSize} className={`note-editor__window fixed z-50 min-h-[120px] min-w-[280px] max-w-[90vw] overflow-hidden rounded-[20px] border shadow-[0_24px_64px_rgba(0,0,0,.28)] ${isColor ? palette.note : 'border-white/35 bg-white/20 text-slate-900 backdrop-saturate-200 backdrop-blur-2xl'}`} style={{ left: position.x, top: position.y, width: note.size?.width ?? 420, height: collapsed ? 'auto' : note.size?.height ?? 520, resize: collapsed ? 'none' : 'both' }}>
    <header onPointerDown={startDrag} className="flex cursor-move items-center justify-between gap-2 px-4 py-3"><div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold"><GripHorizontalIcon className={`size-4 shrink-0 ${palette.toolbar}`} /><input value={note.title} onChange={event => onUpdate(note.id, { title: event.target.value })} placeholder="Untitled" className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-500" /></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setCollapsed(value => !value)} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label={collapsed ? 'Mở rộng note' : 'Thu gọn note'} title={collapsed ? 'Mở rộng note' : 'Thu gọn note'}>{collapsed ? <Maximize2Icon className="size-4" /> : <Minimize2Icon className="size-4" />}</button><button type="button" onClick={() => onUpdate(note.id, { theme: isColor ? 'blur' : 'color' })} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Đổi nền note" title="Đổi nền note">{isColor ? <ToggleLeftIcon className="size-4" /> : <ToggleRightIcon className="size-4" />}</button>{isColor && <button type="button" onClick={() => onCycleColor(note.id)} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Đổi màu note" title="Đổi màu note"><PaletteIcon className="size-4" /></button>}<button type="button" onClick={() => onDelete(note.id)} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Xóa note" title="Xóa note"><TrashIcon className="size-4" /></button><button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-full border border-slate-900/10 bg-white/35 text-slate-700 transition hover:bg-white/75" aria-label="Đóng note" title="Đóng note"><XIcon className="size-4" /></button></div></header>
    {!collapsed && <div className="h-[calc(100%-3.25rem)] px-4 pb-4"><div className="note-editor flex h-full flex-col overflow-hidden rounded-xl rounded-t-none border border-black/10 bg-white/60"><div role="toolbar" aria-label="Note formatting" className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-white/80 px-2 py-2">{controls.map(([key, glyph, label, onClick]) => <button key={key} type="button" onMouseDown={event => event.preventDefault()} onClick={onClick} className={`inline-flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-md border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${isActive(key) ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-sky-500/80' : 'border-slate-400/70 bg-white/75 text-slate-800 hover:bg-white'}`} aria-label={label} title={label} aria-pressed={isActive(key)}>{glyph}</button>)}</div><div ref={editorRef} contentEditable suppressContentEditableWarning onBeforeInput={handleBeforeInput} onInput={saveContent} onKeyUp={event => { if (event.key.startsWith('Arrow') || ['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) refreshCaretMarkState(); else setToolbarVersion(version => version + 1) }} onMouseUp={refreshSelectionToolbar} className="note-editor__content min-h-[220px] flex-1 overflow-auto px-3 py-2 text-sm text-slate-900 outline-none" /></div></div>}
  </section>
}

export function NotesPanel({ open, onClose, onToggle }: Props) {
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

  return <><button type="button" onClick={onToggle} className="luxe-glass-surface luxe-glass-surface--action fixed bottom-6 left-6 z-30 flex size-11 items-center justify-center rounded-full text-white/90 shadow-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label={open ? 'Đóng notes' : 'Mở notes'} title="Notes"><FileIcon className="size-5" />{notes.length > 0 && <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-900 ring-2 ring-white/50 shadow-[0_0_12px_rgba(255,255,255,.65)]">{notes.length}</span>}</button>{open && <section className="luxe-note-surface fixed bottom-20 right-6 z-40 w-[320px] max-w-[calc(100vw-3rem)] rounded-[20px] border border-white/15 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,.7)]"><header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2"><h3 className="text-sm font-semibold">My Notes</h3><span className="luxe-glass-surface rounded-full px-2 py-0.5 text-xs text-white/70">{visible.length}</span></div><div className="flex items-center gap-1"><button type="button" onClick={create} className="notes-panel-action luxe-glass-surface inline-flex size-8 items-center justify-center rounded-full text-white/90 transition" aria-label="Tạo note"><PlusIcon className="size-4" /></button><button type="button" onClick={onClose} className="notes-panel-action luxe-glass-surface inline-flex size-8 items-center justify-center rounded-full text-white/90 transition" aria-label="Đóng notes"><XIcon className="size-4" /></button></div></header><div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2"><SearchIcon className="size-4 shrink-0 text-white/45" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notes..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" /></div><div className="max-h-[60vh] space-y-3 overflow-y-auto p-3">{visible.map((note, index) => <button key={note.id} type="button" onClick={() => openEditor(note.id)} className={`w-full rounded-[16px] border px-3 py-2 text-left transition ${noteColors[note.color ?? colorOrder[index % colorOrder.length]].panel} ${openNoteIds.includes(note.id) ? 'ring-2 ring-white/70' : 'hover:ring-2 hover:ring-white/30'}`}><h4 className="text-sm font-semibold">{note.title || 'Untitled'}</h4><p className="mt-1 max-h-12 overflow-hidden text-xs opacity-80">{plainText(note.content) || 'No content yet'}</p><p className="mt-2 text-[11px] opacity-70">{formatDateTime(note.updatedAt)}</p></button>)}{!visible.length && <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">{notes.length ? 'No matching notes.' : 'Create your first note.'}</div>}</div></section>}{openNotes.map(note => <NoteEditor key={note.id} note={note} onClose={() => closeEditor(note.id)} onUpdate={update} onDelete={deleteNote} onCycleColor={cycleColor} />)}</>
}
