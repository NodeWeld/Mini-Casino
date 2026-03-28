import { useCallback, useRef, useState } from 'react'
import Reel, { SLOT_SYMBOLS } from './Reel.jsx'
import { useBalance } from '../../hooks/useBalance.js'
import { useSound } from '../../hooks/useSound.js'

const THREE_KIND = {
  '7️⃣': 100,
  '💎': 50,
  '🃏': 40,
  '⭐': 25,
  '🔔': 15,
  '🍋': 10,
  '🍒': 5,
}

function randomSymbol() {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
}

function computePayout(a, b, c, bet) {
  if (a === b && b === c) {
    const m = THREE_KIND[a] ?? 8
    return bet * m
  }
  if (a === b || b === c || a === c) {
    return bet * 2
  }
  return 0
}

const SETTLE_MS = [2400, 3200, 4000]

export default function SlotMachine({
  betAmount,
  setInsufficient,
  busy,
  setBusy,
  onWinFloat,
  onBalanceFlash,
  triggerSparkles,
}) {
  const { balance, adjust } = useBalance()
  const { reelSpin, win, bigWin, lose } = useSound()
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(['🍒', '🍋', '🔔'])
  const [spinId, setSpinId] = useState(0)
  const spinRef = useRef(false)
  const outcomesRef = useRef(['🍒', '🍋', '🔔'])
  const landedRef = useRef(0)
  const payoutLockedRef = useRef(false)

  const lastTick = useRef(0)
  const onReelTick = useCallback(() => {
    const now = performance.now()
    if (now - lastTick.current < 90) return
    lastTick.current = now
    reelSpin()
  }, [reelSpin])

  const onReelLanded = useCallback(() => {
    landedRef.current += 1
    if (landedRef.current < 3) return
    landedRef.current = 0
    if (payoutLockedRef.current) return
    payoutLockedRef.current = true
    spinRef.current = false
    setSpinning(false)

    const [a, b, c] = outcomesRef.current
    const payout = computePayout(a, b, c, betAmount)
    if (payout > 0) {
      adjust(payout, { game: 'Slots', label: `Win $${payout}` })
      onWinFloat?.(payout)
      onBalanceFlash?.('win')
      if (payout >= betAmount * 25) {
        bigWin()
        triggerSparkles?.()
      } else {
        win()
      }
    } else {
      lose()
      onBalanceFlash?.('lose')
    }

    setBusy?.(false)
  }, [
    betAmount,
    adjust,
    onWinFloat,
    onBalanceFlash,
    win,
    bigWin,
    lose,
    triggerSparkles,
    setBusy,
  ])

  const spin = useCallback(() => {
    if (spinning || busy || spinRef.current) return
    if (betAmount <= 0) return
    if (balance < betAmount) {
      setInsufficient?.(true)
      setTimeout(() => setInsufficient?.(false), 2000)
      return
    }

    const a = randomSymbol()
    const b = randomSymbol()
    const c = randomSymbol()
    outcomesRef.current = [a, b, c]
    setResult([a, b, c])
    landedRef.current = 0
    payoutLockedRef.current = false
    spinRef.current = true
    setBusy?.(true)
    setSpinning(true)
    setSpinId((n) => n + 1)
    adjust(-betAmount, { game: 'Slots', label: `Bet $${betAmount}` })
  }, [spinning, busy, betAmount, balance, adjust, setBusy, setInsufficient])

  return (
    <div className="mx-auto max-w-lg space-y-6 px-2">
      <div className="slot-cabinet">
        <div className="slot-cabinet-marquee mb-3 px-3 py-2 text-center">
          <span className="font-display text-xl tracking-[0.35em] text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] sm:text-2xl">
            LUCKY 7
          </span>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            3 reels · insert bet · pull spin
          </p>
        </div>

        <div className="slot-window-well">
          <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-mono text-[10px] text-zinc-500">PAYLINE</span>
            <span className="rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-amber-500/90">
              COIN IN
            </span>
          </div>
          <div className="flex justify-center gap-2 sm:gap-3">
            <Reel
              spinId={spinId}
              spinning={spinning}
              finalSymbol={result[0]}
              settleMs={SETTLE_MS[0]}
              onTick={onReelTick}
              onLanded={onReelLanded}
            />
            <Reel
              spinId={spinId}
              spinning={spinning}
              finalSymbol={result[1]}
              settleMs={SETTLE_MS[1]}
              onLanded={onReelLanded}
            />
            <Reel
              spinId={spinId}
              spinning={spinning}
              finalSymbol={result[2]}
              settleMs={SETTLE_MS[2]}
              onLanded={onReelLanded}
            />
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={spin}
            disabled={spinning || busy || betAmount <= 0}
            className="rounded-lg border-2 border-amber-700/80 bg-gradient-to-b from-red-700 via-red-800 to-red-950 px-14 py-3 font-display text-xl tracking-widest text-amber-100 shadow-[0_4px_0_#450a0a,0_8px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_#450a0a] disabled:opacity-40"
          >
            {spinning ? '…' : 'SPIN'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/90 p-4 font-mono text-xs shadow-inner sm:text-sm">
        <p className="mb-2 font-display text-sm tracking-wide text-amber-500/90">Paytable (× bet)</p>
        <ul className="grid grid-cols-2 gap-1 text-zinc-300">
          {Object.entries(THREE_KIND).map(([sym, m]) => (
            <li key={sym}>
              {sym} … {m}×
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
