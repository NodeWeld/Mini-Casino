import { useCallback, useRef, useState } from 'react'
import PokerHand from './PokerHand.jsx'
import { evaluatePokerHand, PAYOUT_TABLE_ROWS } from '../../utils/pokerEval.js'
import { shuffleDeck, createDeck } from '../../hooks/useDeck.js'
import { useBalance } from '../../hooks/useBalance.js'
import { useSound } from '../../hooks/useSound.js'

function drawFrom(deckRef, n) {
  const out = []
  for (let i = 0; i < n; i++) {
    if (deckRef.current.length < 4) {
      deckRef.current = shuffleDeck(createDeck())
    }
    out.push(deckRef.current.pop())
  }
  return out
}

export default function VideoPoker({
  betAmount,
  setInsufficient,
  busy,
  setBusy,
  onWinFloat,
  onBalanceFlash,
  triggerSparkles,
}) {
  const { balance, adjust } = useBalance()
  const { cardDeal, win, bigWin, lose } = useSound()
  const deckRef = useRef(shuffleDeck(createDeck()))
  const [phase, setPhase] = useState('idle')
  const [cards, setCards] = useState([])
  const [held, setHeld] = useState([false, false, false, false, false])
  const [evalResult, setEvalResult] = useState(null)
  const [animateDeal, setAnimateDeal] = useState(false)

  const toggleHold = useCallback(
    (i) => {
      if (phase !== 'dealt' || busy) return
      setHeld((h) => h.map((v, j) => (j === i ? !v : v)))
    },
    [phase, busy]
  )

  const deal = useCallback(() => {
    if (busy) return
    if (phase !== 'idle' && phase !== 'done') return
    if (betAmount <= 0) return
    if (balance < betAmount) {
      setInsufficient?.(true)
      setTimeout(() => setInsufficient?.(false), 2000)
      return
    }

    setBusy?.(true)
    deckRef.current = shuffleDeck(createDeck())
    adjust(-betAmount, { game: 'Video Poker', label: `Bet $${betAmount}` })
    const dealt = drawFrom(deckRef, 5)
    setCards(dealt)
    setHeld([false, false, false, false, false])
    setEvalResult(null)
    setPhase('dealt')
    setAnimateDeal(true)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => cardDeal(), i * 90)
    }
    setTimeout(() => setAnimateDeal(false), 600)
    setBusy?.(false)
  }, [busy, phase, betAmount, balance, adjust, setBusy, setInsufficient, cardDeal])

  const draw = useCallback(() => {
    if (phase !== 'dealt' || busy) return

    setBusy?.(true)
    const next = cards.map((c, i) => (held[i] ? c : null))
    for (let i = 0; i < 5; i++) {
      if (!held[i]) {
        next[i] = drawFrom(deckRef, 1)[0]
        cardDeal()
      }
    }
    setCards(next)
    setPhase('done')

    const ev = evaluatePokerHand(next)
    setEvalResult(ev)
    const profit = betAmount * ev.multiplier
    const totalReturn = profit > 0 ? betAmount + profit : 0

    if (profit > 0) {
      adjust(totalReturn, { game: 'Video Poker', label: `${ev.name} +$${profit}` })
      onWinFloat?.(profit)
      onBalanceFlash?.('win')
      if (ev.multiplier >= 25) {
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
    phase,
    busy,
    cards,
    held,
    betAmount,
    adjust,
    setBusy,
    cardDeal,
    onWinFloat,
    onBalanceFlash,
    win,
    bigWin,
    lose,
    triggerSparkles,
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-2">
      <div className="slot-cabinet">
        <div className="slot-cabinet-marquee mb-3 px-3 py-2 text-center">
          <span className="font-display text-xl tracking-[0.25em] text-amber-400 sm:text-2xl">VIDEO POKER</span>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            Jacks or Better · 5-card draw
          </p>
        </div>
        <div className="slot-window-well">
          <div className="casino-felt rounded-md border border-white/10 p-4 sm:p-5">
            <div className="mb-4 border-b border-white/10 pb-3 text-center">
              <h2 className="font-display text-2xl tracking-wide text-amber-200 sm:text-3xl">DRAW POKER</h2>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-emerald-100/55">
                Hold cards · Draw once · See paytable
              </p>
            </div>
            <PokerHand
              cards={cards}
              held={held}
              onToggleHold={toggleHold}
              disabled={phase !== 'dealt'}
              animateDeal={animateDeal}
            />
            {evalResult && (
              <div className="mt-4 rounded-md border border-amber-900/50 bg-black/40 py-3 text-center">
                <p className="font-display text-xl tracking-wide text-amber-300 sm:text-2xl">{evalResult.name}</p>
                {evalResult.multiplier > 0 ? (
                  <p className="mt-1 font-mono text-sm text-amber-100">
                    Win +${betAmount * evalResult.multiplier} (returned $
                    {betAmount + betAmount * evalResult.multiplier})
                  </p>
                ) : (
                  <p className="font-mono text-sm text-zinc-400">No winning hand</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border-2 border-zinc-600 bg-gradient-to-b from-zinc-800 to-zinc-950 p-3 font-mono text-xs shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          <p className="mb-2 font-display text-sm tracking-wide text-amber-500">Paytable (coins × bet)</p>
          <ul className="space-y-0.5 text-zinc-300">
            {PAYOUT_TABLE_ROWS.map((r) => (
              <li key={r.name} className="flex justify-between gap-2 border-b border-white/5 py-0.5">
                <span>{r.name}</span>
                <span className="text-amber-400">{r.mult}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            disabled={busy || (phase !== 'idle' && phase !== 'done')}
            onClick={deal}
            className="w-full max-w-xs rounded-lg border-2 border-amber-800 bg-gradient-to-b from-emerald-800 to-emerald-950 py-3 font-display text-lg tracking-widest text-amber-100 shadow-[0_4px_0_#052e16,inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:brightness-110 active:translate-y-0.5 disabled:opacity-40"
          >
            Deal
          </button>
          <button
            type="button"
            disabled={busy || phase !== 'dealt'}
            onClick={draw}
            className="w-full max-w-xs rounded-lg border-2 border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 py-3 font-display text-lg tracking-widest text-white shadow-[0_3px_0_#18181b,inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:brightness-110 active:translate-y-0.5 disabled:opacity-40"
          >
            Draw
          </button>
        </div>
      </div>
    </div>
  )
}
