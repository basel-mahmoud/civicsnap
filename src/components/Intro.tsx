import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const LINES = [
  '> INITIALIZING CIVICSNAP REGISTRY',
  '> MOUNTING MAP TILES ............ OK',
  '> CLAUDE VISION MODULE ......... ONLINE',
  '> RLS / SECURITY POLICIES ...... ACTIVE',
  '> SYSTEM READY',
]

// Terminal boot overlay. Shows once per session, wipes up to reveal the page.
export function Intro() {
  const reduce = useReducedMotion()
  const [done, setDone] = useState(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem('cs_intro') === '1'
  })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (done) return
    if (reduce) {
      finish()
      return
    }
    const lineTimer = setInterval(() => {
      setCount((c) => {
        if (c >= LINES.length) {
          clearInterval(lineTimer)
          return c
        }
        return c + 1
      })
    }, 240)
    const end = setTimeout(finish, 1850)
    return () => {
      clearInterval(lineTimer)
      clearTimeout(end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function finish() {
    sessionStorage.setItem('cs_intro', '1')
    setDone(true)
  }

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[2000] bg-[#0c1322] text-[#e8e2d4] flex items-center justify-center cursor-pointer"
          onClick={finish}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* scanlines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)',
            }}
          />
          <div className="w-[min(90vw,520px)] font-mono text-[13px] leading-7">
            <p className="text-[#e0a23a] mb-4 tracking-[0.2em] text-xs">CIVICSNAP ® // BOOT</p>
            {LINES.slice(0, count).map((l) => (
              <p key={l} className="whitespace-pre">
                {l}
              </p>
            ))}
            <span className="inline-block w-2.5 h-4 bg-[#e0a23a] align-middle animate-pulse" />
          </div>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-[#8a93a8] uppercase">
            Click to skip
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
