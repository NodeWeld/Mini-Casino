import { useEffect, useRef } from 'react'
import {
  getNumberColor,
  WHEEL_ORDER,
  WHEEL_SEG_DEG,
  pocketCenterAngleDeg,
  wheelIndexForNumber,
} from '../../utils/rouletteLogic.js'

function mod360(x) {
  return ((x % 360) + 360) % 360
}

function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5)
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

/** Idle: only the wheel turns; ball stays off until SPIN. */
const IDLE_WHEEL_DPS = 48
const THROW_MS = 520

export default function RouletteWheel({
  restingWheelDeg,
  restingBallDeg,
  spinRequest,
  onSettled,
  spinning,
}) {
  const wheelRef = useRef(null)
  const ballArmRef = useRef(null)
  const ballRef = useRef(null)
  const ballLayerRef = useRef(null)
  const wheelDegRef = useRef(restingWheelDeg)
  const ballDegRef = useRef(restingBallDeg)
  const prevRestRef = useRef({ w: restingWheelDeg, b: restingBallDeg })
  const rafRef = useRef(null)
  const settledRef = useRef(onSettled)
  settledRef.current = onSettled

  const SEG = WHEEL_SEG_DEG

  const applyBallRadiusPct = (pct) => {
    if (ballRef.current) ballRef.current.style.transform = `translateY(-${pct}%)`
  }

  const setBallLayerVisible = (on) => {
    if (ballLayerRef.current) ballLayerRef.current.style.opacity = on ? '1' : '0'
  }

  useEffect(() => {
    if (spinRequest) return
    if (
      prevRestRef.current.w !== restingWheelDeg ||
      prevRestRef.current.b !== restingBallDeg
    ) {
      wheelDegRef.current = restingWheelDeg
      ballDegRef.current = restingBallDeg
      prevRestRef.current = { w: restingWheelDeg, b: restingBallDeg }
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${wheelDegRef.current}deg)`
      if (ballArmRef.current) {
        ballArmRef.current.style.transform = `rotate(${ballDegRef.current}deg)`
      }
      applyBallRadiusPct(47.5)
      setBallLayerVisible(false)
    }
  }, [restingWheelDeg, restingBallDeg, spinRequest])

  useEffect(() => {
    if (spinRequest) return

    setBallLayerVisible(false)

    let raf
    let last = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      wheelDegRef.current += IDLE_WHEEL_DPS * dt

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${wheelDegRef.current}deg)`
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [spinRequest])

  useEffect(() => {
    if (!spinRequest) return

    const { id, target, durationMs, wheelFullSpins, ballFullSpins, ballJitter } = spinRequest

    const w0 = wheelDegRef.current
    const bSaved = ballDegRef.current
    const bLaunch = bSaved - 125
    const idx = wheelIndexForNumber(target)
    const pc = pocketCenterAngleDeg(idx)

    const wThrowEnd = w0 + IDLE_WHEEL_DPS * (THROW_MS / 1000)
    const bTrack0 = bSaved
    const bEnd = bTrack0 - ballFullSpins * 360 - ballJitter
    const targetWheelMod = mod360(-90 + bEnd - pc)
    const wDelta = mod360(targetWheelMod - mod360(wThrowEnd))
    const wEnd = wThrowEnd + wheelFullSpins * 360 + wDelta

    const dw = wEnd - wThrowEnd
    const db = bEnd - bTrack0

    if (wheelRef.current) wheelRef.current.style.transform = `rotate(${w0}deg)`
    if (ballArmRef.current) ballArmRef.current.style.transform = `rotate(${bLaunch}deg)`
    applyBallRadiusPct(60)
    setBallLayerVisible(true)
    if (ballRef.current) {
      ballRef.current.style.transform = 'translateY(-60%) scale(0.55)'
      ballRef.current.style.opacity = '0.85'
    }

    let cancelled = false
    const t0 = performance.now()
    const mainDuration = durationMs

    const tick = (now) => {
      if (cancelled) return
      const elapsed = now - t0

      if (elapsed < THROW_MS) {
        const u = elapsed / THROW_MS
        const e = easeOutCubic(u)
        const w = w0 + IDLE_WHEEL_DPS * (elapsed / 1000)
        const b = bLaunch + (bTrack0 - bLaunch) * e
        const rad = 60 + (47.5 - 60) * e
        const sc = 0.55 + 0.45 * e

        if (wheelRef.current) wheelRef.current.style.transform = `rotate(${w}deg)`
        if (ballArmRef.current) ballArmRef.current.style.transform = `rotate(${b}deg)`
        applyBallRadiusPct(rad)
        if (ballRef.current) {
          ballRef.current.style.transform = `translateY(-${rad}%) scale(${sc})`
          ballRef.current.style.opacity = String(Math.min(1, 0.2 + 0.8 * Math.min(1, u * 1.4)))
        }

        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const elapsed2 = elapsed - THROW_MS
      const rawM = Math.min(1, elapsed2 / mainDuration)
      const t = easeOutQuint(rawM)

      const w = wThrowEnd + dw * t
      const b = bTrack0 + db * t

      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${w}deg)`
      if (ballArmRef.current) ballArmRef.current.style.transform = `rotate(${b}deg)`
      if (ballRef.current) {
        ballRef.current.style.transform = 'translateY(-47.5%) scale(1)'
        ballRef.current.style.opacity = '1'
      }

      const outer = 47.5
      const inner = 41.2
      const dropStart = 0.68
      if (rawM < dropStart) {
        applyBallRadiusPct(outer)
      } else {
        const u2 = (rawM - dropStart) / (1 - dropStart)
        const e2 = 1 - Math.pow(1 - u2, 3)
        applyBallRadiusPct(outer + (inner - outer) * e2)
      }

      if (rawM < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        wheelDegRef.current = wEnd
        ballDegRef.current = bEnd
        applyBallRadiusPct(inner)
        if (ballRef.current) {
          ballRef.current.style.transform = `translateY(-${inner}%) scale(1)`
        }
        settledRef.current?.({ wheelEnd: wEnd, ballEnd: bEnd, id })
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [spinRequest])

  const pocketOuter = 82
  const pocketInner = 32
  const hubR = 22

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,380px)]">
      <div className="relative aspect-square">
        <div className="roulette-wood-bowl absolute inset-0 rounded-full" />
        <div
          className="pointer-events-none absolute inset-[2.5%] rounded-full border border-black/50"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
        />

        <div className="absolute inset-[7%]">
          <div
            ref={wheelRef}
            className="absolute inset-0 will-change-transform"
            style={{ transform: `rotate(${restingWheelDeg}deg)` }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full" shapeRendering="geometricPrecision">
              <defs>
                <radialGradient id="rw-hubMetal" cx="32%" cy="28%" r="72%">
                  <stop offset="0%" stopColor="#f4f4f5" />
                  <stop offset="40%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#27272a" />
                </radialGradient>
                <linearGradient id="rw-brass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#a16207" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="rw-redP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id="rw-blackP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
                <linearGradient id="rw-greenP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="100%" stopColor="#14532d" />
                </linearGradient>
              </defs>

              {WHEEL_ORDER.map((n, i) => {
                const start = i * SEG - 90
                const end = (i + 1) * SEG - 90
                const col = getNumberColor(n)
                const gid = col === 'green' ? 'rw-greenP' : col === 'red' ? 'rw-redP' : 'rw-blackP'
                const rad = (a) => toRad(a)
                const x1 = 100 + pocketOuter * Math.cos(rad(start))
                const y1 = 100 + pocketOuter * Math.sin(rad(start))
                const x2 = 100 + pocketOuter * Math.cos(rad(end))
                const y2 = 100 + pocketOuter * Math.sin(rad(end))
                const xi1 = 100 + pocketInner * Math.cos(rad(start))
                const yi1 = 100 + pocketInner * Math.sin(rad(start))
                const xi2 = 100 + pocketInner * Math.cos(rad(end))
                const yi2 = 100 + pocketInner * Math.sin(rad(end))
                const large = SEG > 180 ? 1 : 0
                const d = `M ${x1} ${y1} A ${pocketOuter} ${pocketOuter} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${pocketInner} ${pocketInner} 0 ${large} 0 ${xi1} ${yi1} Z`
                const mid = start + SEG / 2
                const midR = toRad(mid)
                const tx = 100 + 56 * Math.cos(midR)
                const ty = 100 + 56 * Math.sin(midR)
                const fs = n >= 10 ? 5 : n === 0 ? 6.2 : 6.8

                return (
                  <g key={`${n}-${i}`}>
                    <path d={d} fill={`url(#${gid})`} stroke="url(#rw-brass)" strokeWidth="0.5" />
                    <text
                      x={tx}
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize={fs}
                      fontWeight="700"
                      fontFamily="system-ui,Segoe UI,Arial,sans-serif"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95)' }}
                      transform={`rotate(${mid + 90}, ${tx}, ${ty})`}
                    >
                      {n}
                    </text>
                  </g>
                )
              })}

              <circle cx="100" cy="100" r={hubR + 1.5} fill="none" stroke="url(#rw-brass)" strokeWidth="1" />
              <circle cx="100" cy="100" r={hubR} fill="url(#rw-hubMetal)" stroke="#18181b" strokeWidth="0.4" />
              <ellipse cx="93" cy="93" rx="7" ry="4" fill="rgba(255,255,255,0.28)" />
            </svg>
          </div>

          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 200 200" aria-hidden>
            <defs>
              <linearGradient id="rw-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#94a3b8" />
                <stop offset="55%" stopColor="#475569" />
                <stop offset="80%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="93"
              fill="none"
              stroke="url(#rw-chrome)"
              strokeWidth="11"
              opacity="0.97"
            />
            <circle cx="100" cy="100" r="93" fill="none" stroke="#020617" strokeWidth="0.6" opacity="0.7" />
            <circle cx="100" cy="100" r="87.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
          </svg>

          <div
            ref={ballLayerRef}
            className="pointer-events-none absolute inset-0 transition-opacity duration-150"
            style={{ opacity: 0 }}
          >
            <div
              ref={ballArmRef}
              className="absolute inset-0 flex justify-center will-change-transform"
              style={{ transform: `rotate(${restingBallDeg}deg)` }}
            >
              <div className="relative mt-[4%] flex w-3 justify-center">
                <div
                  ref={ballRef}
                  className="h-3 w-3 rounded-full"
                  style={{
                    transform: 'translateY(-47.5%)',
                    background:
                      'radial-gradient(circle at 30% 25%, #ffffff 0%, #e2e8f0 22%, #64748b 58%, #1e293b 100%)',
                    boxShadow:
                      '0 2px 5px rgba(0,0,0,0.75), inset -1px -1px 2px rgba(0,0,0,0.4), inset 2px 2px 3px rgba(255,255,255,0.9)',
                  }}
                />
              </div>
            </div>
          </div>

          {spinning && (
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: 'inset 0 0 36px rgba(255,255,255,0.05)' }}
            />
          )}
        </div>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
        Wheel runs continuously · winning number is where the ball settles
      </p>
    </div>
  )
}
