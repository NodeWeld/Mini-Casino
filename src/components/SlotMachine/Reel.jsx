import { useEffect, useMemo, useRef, useState } from 'react'

export const SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣', '🃏']

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

export default function Reel({
  spinId,
  spinning,
  finalSymbol,
  settleMs,
  symbolHeight = 58,
  onTick,
  onLanded,
}) {
  const strip = useMemo(() => [...SLOT_SYMBOLS, ...SLOT_SYMBOLS, ...SLOT_SYMBOLS], [])
  const totalH = strip.length * symbolHeight
  const unitH = SLOT_SYMBOLS.length * symbolHeight

  const innerRef = useRef(null)
  const offsetRef = useRef(0)
  const [displayY, setDisplayY] = useState(0)
  const tickThrottle = useRef(0)
  const tickRef = useRef(onTick)
  const landRef = useRef(onLanded)
  tickRef.current = onTick
  landRef.current = onLanded

  useEffect(() => {
    offsetRef.current = displayY
  }, [displayY])

  useEffect(() => {
    if (!spinning) return

    const idx = Math.max(0, SLOT_SYMBOLS.indexOf(finalSymbol))
    const targetY = idx * symbolHeight
    const start = offsetRef.current
    const m = ((start % unitH) + unitH) % unitH
    let delta = targetY - m
    if (delta < 0) delta += unitH
    const extraLaps = 4 + Math.floor(Math.random() * 3) + Math.min(5, Math.floor(settleMs / 500))
    const end = start + extraLaps * unitH + delta

    const t0 = performance.now()
    let raf = null
    let finished = false
    let alive = true

    const step = (now) => {
      if (!alive) return
      const raw = Math.min(1, (now - t0) / settleMs)
      const e = easeOutQuart(raw)
      const off = start + (end - start) * e
      const y = ((off % totalH) + totalH) % totalH
      offsetRef.current = off
      if (innerRef.current) {
        innerRef.current.style.transform = `translateY(-${y}px)`
        innerRef.current.style.filter = raw < 0.88 ? 'blur(1.4px)' : 'blur(0)'
      }
      if (now - tickThrottle.current > 85) {
        tickThrottle.current = now
        tickRef.current?.()
      }
      if (raw < 1) {
        raf = requestAnimationFrame(step)
      } else if (!finished) {
        finished = true
        if (!alive) return
        const finalY = ((end % totalH) + totalH) % totalH
        setDisplayY(finalY)
        if (innerRef.current) {
          innerRef.current.style.transform = `translateY(-${finalY}px)`
          innerRef.current.style.filter = 'none'
        }
        landRef.current?.()
      }
    }

    raf = requestAnimationFrame(step)
    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
    }
  }, [spinning, spinId, finalSymbol, settleMs, totalH, unitH])

  const w = 60

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="slot-chrome-bezel p-[3px]"
        style={{ width: w + 6 }}
      >
        <div
          className="relative overflow-hidden bg-[#050505] shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]"
          style={{ height: symbolHeight, width: w }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-white/12 via-transparent to-black/50"
            aria-hidden
          />
          <div
            ref={innerRef}
            className="reel-inner flex flex-col items-center transition-none"
            style={{
              transform: `translateY(-${displayY}px)`,
            }}
          >
            {strip.map((s, i) => (
              <div
                key={`${i}-${s}`}
                className="flex shrink-0 items-center justify-center border-b border-black/80 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-[1.65rem] leading-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                style={{ height: symbolHeight, width: w }}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-90 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
        </div>
      </div>
      <div className="mt-1 flex gap-1">
        <div className="h-1 w-1 rounded-full bg-amber-700 shadow-inner" />
        <div className="h-1 w-1 rounded-full bg-amber-700 shadow-inner" />
        <div className="h-1 w-1 rounded-full bg-amber-700 shadow-inner" />
      </div>
    </div>
  )
}
