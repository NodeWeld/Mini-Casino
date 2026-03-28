import { useCallback, useEffect, useRef, useState } from 'react'
import RouletteWheel from './RouletteWheel.jsx'
import RouletteBetting from './RouletteBetting.jsx'
import { settleRoulette, totalBetAmount } from '../../utils/rouletteLogic.js'
import { useBalance } from '../../hooks/useBalance.js'
import { useSound } from '../../hooks/useSound.js'

export default function Roulette({
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
  const [bets, setBets] = useState({})
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [restWheel, setRestWheel] = useState(0)
  const [restBall, setRestBall] = useState(0)
  const [spinRequest, setSpinRequest] = useState(null)
  const spinIdRef = useRef(0)
  const pendingRef = useRef(null)
  const soundIvRef = useRef(null)

  useEffect(() => {
    return () => {
      if (soundIvRef.current) clearInterval(soundIvRef.current)
    }
  }, [])

  const addBet = useCallback(
    (key) => {
      if (spinning || busy) return
      if (betAmount <= 0) return
      const currentTotal = totalBetAmount(bets)
      if (balance < currentTotal + betAmount) {
        setInsufficient?.(true)
        setTimeout(() => setInsufficient?.(false), 2000)
        return
      }
      setBets((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + betAmount,
      }))
    },
    [spinning, busy, betAmount, balance, bets, setInsufficient]
  )

  const clearBets = useCallback(() => {
    if (spinning || busy) return
    setBets({})
  }, [spinning, busy])

  const onWheelSettled = useCallback(
    ({ wheelEnd, ballEnd, id }) => {
      if (id !== spinIdRef.current) return

      if (soundIvRef.current) {
        clearInterval(soundIvRef.current)
        soundIvRef.current = null
      }

      setRestWheel(wheelEnd)
      setRestBall(ballEnd)
      setSpinRequest(null)
      setSpinning(false)

      const pending = pendingRef.current
      pendingRef.current = null
      if (!pending) {
        setBusy?.(false)
        return
      }

      const { target, betsSnapshot, wager } = pending
      const payout = settleRoulette(target, betsSnapshot)
      setResult(target)
      setBets({})

      if (payout > 0) {
        adjust(payout, { game: 'Roulette', label: `Win $${payout}` })
        const profit = payout - wager
        onWinFloat?.(profit)
        onBalanceFlash?.('win')
        if (profit >= wager * 5) {
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
    },
    [adjust, onWinFloat, onBalanceFlash, win, bigWin, lose, triggerSparkles, setBusy]
  )

  const spin = useCallback(() => {
    if (spinning || busy || spinRequest) return
    const wager = totalBetAmount(bets)
    if (wager <= 0) return
    if (balance < wager) {
      setInsufficient?.(true)
      setTimeout(() => setInsufficient?.(false), 2000)
      return
    }

    const target = Math.floor(Math.random() * 37)
    const wheelFullSpins = 6 + Math.floor(Math.random() * 5)
    const ballFullSpins = 13 + Math.floor(Math.random() * 8)
    const ballJitter = 90 + Math.random() * 200

    const id = ++spinIdRef.current
    pendingRef.current = { target, betsSnapshot: { ...bets }, wager }

    setBusy?.(true)
    setSpinning(true)
    setResult(null)
    adjust(-wager, { game: 'Roulette', label: `Bet $${wager}` })

    soundIvRef.current = setInterval(() => reelSpin(), 110)
    setSpinRequest({
      id,
      target,
      wheelFullSpins,
      ballFullSpins,
      ballJitter,
      durationMs: 6400 + Math.floor(Math.random() * 900),
    })
  }, [
    spinning,
    busy,
    spinRequest,
    bets,
    balance,
    adjust,
    setBusy,
    setInsufficient,
    reelSpin,
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-2">
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-[0.35em] text-amber-200 sm:text-4xl">ROULETTE</h2>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          European single-zero
        </p>
      </div>
      <RouletteWheel
        restingWheelDeg={restWheel}
        restingBallDeg={restBall}
        spinRequest={spinRequest}
        onSettled={onWheelSettled}
        spinning={spinning}
      />
      {result !== null && (
        <p className="text-center font-mono text-lg text-zinc-300">
          Winning number{' '}
          <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border-2 border-amber-600/80 bg-zinc-900 px-3 py-1 text-xl font-bold text-amber-300 shadow-inner">
            {result}
          </span>
        </p>
      )}
      <RouletteBetting bets={bets} onAdd={addBet} disabled={spinning || busy} />
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={clearBets}
          disabled={spinning || busy || totalBetAmount(bets) === 0}
          className="btn-neon bg-black/40 px-5 py-2 text-sm text-vegas-pink"
        >
          Clear bets
        </button>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || busy || totalBetAmount(bets) === 0}
          className="btn-neon bg-vegas-purple/30 px-8 py-2 text-lg text-white"
        >
          {spinning ? 'Spinning…' : 'SPIN'}
        </button>
      </div>
      <p className="text-center font-mono text-[10px] uppercase tracking-wide text-zinc-500">
        0–36 · Outside 1:1 / 2:1 — read the result where the ball lands
      </p>
    </div>
  )
}
