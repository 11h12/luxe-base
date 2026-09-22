import { useEffect, useState } from 'react'

export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer) }, [])
  return <section className="text-center text-white drop-shadow-lg"><time className="text-7xl font-semibold tracking-[-.07em] sm:text-8xl">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</time><p className="mt-3 text-sm font-medium tracking-[.18em] text-white/80 uppercase">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p></section>
}
