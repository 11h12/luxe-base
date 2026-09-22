import type { Settings, Task } from './types'
export const DEFAULT_BACKGROUND_URL = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=90'
export const defaults: Settings = { locale: 'vi', showCompletedTasks: false, autoRotateMantras: true, autoRotateQuotes: true, backgroundUrl: DEFAULT_BACKGROUND_URL }
export function read<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback } }
export function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)) }
export const getSettings = () => ({ ...defaults, ...read<Partial<Settings>>('luxe_settings', {}) })
export const setSettings = (value: Settings) => write('luxe_settings', value)
export const getTasks = () => read<Task[]>('luxe_tasks', [])
export const setTasks = (value: Task[]) => write('luxe_tasks', value)
// Recovered verbatim from legacy chunk 905c6fb5790f09a5.js, module 25860.
const defaultMantras = {
  vi: ['Tập trung vào việc quan trọng nhất trước.', 'Tiến bộ nhỏ mỗi ngày tạo nên thành quả lớn.', 'Giữ tỉnh thức, hít thở và tiếp tục tiến lên.', 'Làm ít lại, nhưng chất lượng hơn.', 'Hoàn thành tốt hơn hoàn hảo.', 'Hít vào bình an, thở ra muộn phiền.', 'Nghỉ ngơi cũng là một phần của tiến bộ.', 'Ý tưởng tốt nhất đến khi tâm trí tự do.', 'Hãy tử tế với chính mình hôm nay.', 'Mọi hành trình vạn dặm đều bắt đầu từ một bước chân.', 'Lắng nghe cơ thể bạn đang nói gì.', 'Đừng đợi cảm hứng, hãy bắt đầu ngay.', 'Sự bình yên bắt đầu từ bên trong.'],
  en: ['Focus on the most important task first.', 'Small progress every day leads to big results.', 'Stay present, breathe, and move forward.', 'Do less, but better.', 'Done is better than perfect.', 'Inhale peace, exhale stress.', 'Rest is a part of progress.', 'The best ideas come when the mind is free.', 'Be kind to yourself today.', 'The journey of a thousand miles begins with a single step.', 'Listen to what your body is saying.', 'Don’t wait for inspiration, start now.', 'Peace starts from within.'],
}
const defaultQuotes = {
  vi: ['Tương lai phụ thuộc vào những gì bạn làm hôm nay.', 'Kỷ luật là nhớ điều bạn thật sự muốn.', 'Thành công là tổng của những nỗ lực nhỏ lặp đi lặp lại mỗi ngày.', 'Sáng tạo là cho phép bản thân mắc sai lầm.', 'Chữa lành là một hành trình, không phải đích đến.', 'Mọi thứ bạn tưởng tượng đều có thật.', 'Bạn xứng đáng với những điều tốt đẹp.', 'Sáng tạo là trí thông minh đang dạo chơi.', 'Mọi cảm xúc đều xứng đáng được lắng nghe.', 'Cách tốt nhất để dự đoán tương lai là tạo ra nó.', 'Tìm thấy vẻ đẹp trong những điều nhỏ bé.', 'Buông bỏ những gì không còn phục vụ bạn.', 'Mỗi ngày là một trang giấy trắng để bạn vẽ lên.'],
  en: ['The future depends on what you do today.', 'Discipline is remembering what you want.', 'Success is the sum of small efforts repeated day in and day out.', 'Creativity is allowing yourself to make mistakes.', 'Healing is a journey, not a destination.', 'Everything you can imagine is real.', 'You are worthy of good things.', 'Creativity is intelligence having fun.', 'Every emotion deserves to be heard.', 'The best way to predict the future is to create it.', 'Find beauty in the small things.', 'Let go of what no longer serves you.', 'Every day is a blank canvas for you to paint.'],
}
function seedTextList(key: 'dbindex_mantras' | 'dbindex_quotes', defaultsForLocale: string[]) {
  const saved = read<string[]>(key, [])
  // Preserve a user's custom entries while backfilling the 13 original defaults.
  const next = [...saved, ...defaultsForLocale.filter(item => !saved.includes(item))]
  if (next.length !== saved.length) write(key, next)
  return next
}
export function seedMantras(locale: Settings['locale']) { return seedTextList('dbindex_mantras', defaultMantras[locale]) }
export function seedQuotes(locale: Settings['locale']) { return seedTextList('dbindex_quotes', defaultQuotes[locale]) }
export function saveMantras(value: string[]) { write('dbindex_mantras', value); window.dispatchEvent(new CustomEvent('luxe-content-changed', { detail: { key: 'dbindex_mantras' } })) }
export function saveQuotes(value: string[]) { write('dbindex_quotes', value); window.dispatchEvent(new CustomEvent('luxe-content-changed', { detail: { key: 'dbindex_quotes' } })) }
