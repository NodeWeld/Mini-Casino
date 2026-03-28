import { useCallback, useEffect, useRef, useState } from 'react'
import BlackjackHand from './BlackjackHand.jsx'
import { useBalance } from '../../hooks/useBalance.js'
import { shuffleDeck, createDeck } from '../../hooks/useDeck.js'
import { useSound } from '../../hooks/useSound.js'

function splitRankValue(c) {
  const r = c.rank
  if (r === 'A') return 11
  if (['K', 'Q', 'J', '10'].includes(r)) return 10
  return Number(r)
}

export function handInfo(cards) {
  let sum = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 'A') {
      aces += 1
      sum += 11
    } else if (['K', 'Q', 'J'].includes(c.rank)) {
      sum += 10
    } else {
      sum += Number(c.rank)
    }
  }
  while (sum > 21 && aces > 0) {
    sum -= 10
    aces -= 1
  }
  const soft = aces > 0
  return { value: sum, soft }
}

function dealerShouldHit(info) {
  const { value, soft } = info
  if (value < 17) return true
  if (value === 17 && soft) return false
  if (value === 17 && !soft) return false
  if (value === 16 && soft) return true
  return false
}

function isBlackjack(cards) {
  return cards.length === 2 && handInfo(cards).value === 21
}

function canSplitPair(cards) {
  if (cards.length !== 2) return false
  return splitRankValue(cards[0]) === splitRankValue(cards[1])
}

function popCard(deckRef) {
  if (deckRef.current.length < 4) {
    deckRef.current = shuffleDeck(createDeck())
  }
  return deckRef.current.pop()
}

export default function Blackjack({
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

  const [phase, setPhase] = useState('idle')
  const [dealerCards, setDealerCards] = useState([])
  const [playerHands, setPlayerHands] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [hideHole, setHideHole] = useState(true)
  const [message, setMessage] = useState('')
  const [animateDeal, setAnimateDeal] = useState(false)
  const deckRef = useRef([])
  const settleRef = useRef(false)

  const playDealSound = useCallback(() => {
    cardDeal()
  }, [cardDeal])

  const startRound = useCallback(() => {
    if (busy) return
    if (phase !== 'idle' && phase !== 'done') return
    if (betAmount <= 0) return
    if (balance < betAmount) {
      setInsufficient?.(true)
      setTimeout(() => setInsufficient?.(false), 2000)
      return
    }

    setBusy?.(true)
    setMessage('')
    const deck = shuffleDeck(createDeck())
    deckRef.current = deck
    const p1 = popCard(deckRef)
    const d1 = popCard(deckRef)
    const p2 = popCard(deckRef)
    const d2 = popCard(deckRef)

    adjust(-betAmount, { game: 'Blackjack', label: `Bet $${betAmount}` })
    setDealerCards([d1, d2])
    setPlayerHands([{ cards: [p1, p2], bet: betAmount, doubled: false, stood: false }])
    setActiveIdx(0)
    setHideHole(true)
    setPhase('player')
    setAnimateDeal(true)
    playDealSound()
    setTimeout(() => playDealSound(), 120)
    setTimeout(() => playDealSound(), 240)
    setTimeout(() => playDealSound(), 360)
    setTimeout(() => setAnimateDeal(false), 500)

    const pNatural = isBlackjack([p1, p2])
    const dNatural = isBlackjack([d1, d2])

    if (pNatural || dNatural) {
      setTimeout(() => {
        setHideHole(false)
        if (pNatural && dNatural) {
          adjust(betAmount, { game: 'Blackjack', label: 'Push (both BJ)' })
          setMessage('Push — both blackjack')
        } else if (pNatural) {
          const pay = Math.floor(betAmount * 2.5)
          adjust(pay, { game: 'Blackjack', label: `Blackjack $${pay}` })
          setMessage('Blackjack!')
          onWinFloat?.(pay - betAmount)
          onBalanceFlash?.('win')
          bigWin()
          triggerSparkles?.()
        } else {
          setMessage('Dealer blackjack')
          onBalanceFlash?.('lose')
          lose()
        }
        setPhase('done')
        setBusy?.(false)
      }, 600)
      return
    }

    setBusy?.(false)
  }, [
    busy,
    phase,
    betAmount,
    balance,
    adjust,
    setBusy,
    setInsufficient,
    playDealSound,
    onWinFloat,
    onBalanceFlash,
    bigWin,
    lose,
    triggerSparkles,
  ])

  const hit = useCallback(() => {
    if (phase !== 'player' || busy) return
    const hand = playerHands[activeIdx]
    if (!hand || hand.stood || hand.doubled) return

    setBusy?.(true)
    const c = popCard(deckRef)
    playDealSound()
    const nextCards = [...hand.cards, c]
    const nextHands = [...playerHands]
    nextHands[activeIdx] = { ...hand, cards: nextCards }
    setPlayerHands(nextHands)

    const v = handInfo(nextCards).value
    if (v > 21) {
      if (activeIdx < playerHands.length - 1) {
        setActiveIdx(activeIdx + 1)
        setMessage('Bust — next hand')
      } else {
        setPhase('dealer_end')
      }
    }
    setBusy?.(false)
  }, [phase, busy, playerHands, activeIdx, playDealSound, setBusy])

  const stand = useCallback(() => {
    if (phase !== 'player' || busy) return
    const hand = playerHands[activeIdx]
    if (!hand || hand.doubled) return

    const nextHands = playerHands.map((h, i) =>
      i === activeIdx ? { ...h, stood: true } : h
    )
    setPlayerHands(nextHands)

    if (activeIdx < playerHands.length - 1) {
      setActiveIdx(activeIdx + 1)
    } else {
      setPhase('dealer_end')
    }
  }, [phase, busy, playerHands, activeIdx, setBusy])

  const doubleDown = useCallback(() => {
    if (phase !== 'player' || busy) return
    const hand = playerHands[activeIdx]
    if (!hand || hand.cards.length !== 2 || hand.doubled || hand.stood) return
    if (balance < hand.bet) {
      setInsufficient?.(true)
      setTimeout(() => setInsufficient?.(false), 2000)
      return
    }

    setBusy?.(true)
    adjust(-hand.bet, { game: 'Blackjack', label: `Double $${hand.bet}` })
    const c = popCard(deckRef)
    playDealSound()
    const nextCards = [...hand.cards, c]
    const nextHands = [...playerHands]
    nextHands[activeIdx] = {
      ...hand,
      cards: nextCards,
      bet: hand.bet * 2,
      doubled: true,
      stood: true,
    }
    setPlayerHands(nextHands)

    const v = handInfo(nextCards).value
    if (v > 21 && activeIdx < playerHands.length - 1) {
      setActiveIdx(activeIdx + 1)
    } else {
      setPhase('dealer_end')
    }
    setBusy?.(false)
  }, [phase, busy, playerHands, activeIdx, balance, adjust, playDealSound, setBusy, setInsufficient])

  const split = useCallback(() => {
    if (phase !== 'player' || busy) return
    if (playerHands.length > 1) return
    const hand = playerHands[0]
    if (!canSplitPair(hand.cards)) return
    if (balance < hand.bet) {
      setInsufficient?.(true)
      setTimeout(() => setInsufficient?.(false), 2000)
      return
    }

    setBusy?.(true)
    adjust(-hand.bet, { game: 'Blackjack', label: `Split $${hand.bet}` })
    const [a, b] = hand.cards
    const c1 = popCard(deckRef)
    const c2 = popCard(deckRef)
    playDealSound()
    playDealSound()
    setPlayerHands([
      { cards: [a, c1], bet: hand.bet, doubled: false, stood: false },
      { cards: [b, c2], bet: hand.bet, doubled: false, stood: false },
    ])
    setActiveIdx(0)
    setBusy?.(false)
  }, [phase, busy, playerHands, balance, adjust, playDealSound, setBusy, setInsufficient])

  useEffect(() => {
    if (phase !== 'dealer_end') {
      settleRef.current = false
      return
    }
    if (settleRef.current) return
    settleRef.current = true

    let cancelled = false

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

    const run = async () => {
      setBusy?.(true)
      setHideHole(false)
      await sleep(520)
      if (cancelled) return

      const handsSnapshot = playerHands
      const dealerStart = [...dealerCards]
      const allBust = handsSnapshot.every((h) => handInfo(h.cards).value > 21)

      let d = dealerStart

      if (!allBust) {
        while (dealerShouldHit(handInfo(d)) && !cancelled) {
          const c = popCard(deckRef)
          playDealSound()
          d = [...d, c]
          setDealerCards(d)
          await sleep(520)
          if (cancelled) return
        }
      } else {
        setDealerCards(d)
      }

      const dv = handInfo(d).value
      const wagered = handsSnapshot.reduce((s, h) => s + h.bet, 0)
      let totalReturn = 0
      for (const h of handsSnapshot) {
        const pv = handInfo(h.cards).value
        const bet = h.bet
        if (pv > 21) continue
        if (dv > 21) totalReturn += bet * 2
        else if (pv > dv) totalReturn += bet * 2
        else if (pv === dv) totalReturn += bet
      }

      if (totalReturn > 0) {
        adjust(totalReturn, { game: 'Blackjack', label: `Payout $${totalReturn}` })
      }

      const profit = totalReturn - wagered
      if (profit > 0) {
        onWinFloat?.(profit)
        onBalanceFlash?.('win')
        if (profit >= betAmount * 3) {
          bigWin()
          triggerSparkles?.()
        } else {
          win()
        }
        setMessage(`You win +$${profit}`)
      } else if (profit === 0 && totalReturn === wagered && wagered > 0) {
        setMessage('Push')
      } else {
        lose()
        onBalanceFlash?.('lose')
        setMessage(allBust ? 'Bust' : 'House wins')
      }

      setPhase('done')
      setBusy?.(false)
    }

    run()
    return () => {
      cancelled = true
      settleRef.current = false
    }
  }, [
    phase,
    adjust,
    playDealSound,
    setBusy,
    betAmount,
    onWinFloat,
    onBalanceFlash,
    win,
    bigWin,
    lose,
    triggerSparkles,
  ]) // playerHands/dealerCards read once when phase → dealer_end

  const activeHand = playerHands[activeIdx]
  const canDouble =
    phase === 'player' &&
    activeHand &&
    activeHand.cards.length === 2 &&
    !activeHand.doubled &&
    !activeHand.stood &&
    balance >= activeHand.bet
  const canSplitNow =
    phase === 'player' &&
    playerHands.length === 1 &&
    activeHand &&
    canSplitPair(activeHand.cards) &&
    balance >= activeHand.bet

  const dealerVal = hideHole && dealerCards[0] ? handInfo([dealerCards[0]]).value : handInfo(dealerCards).value

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-2">
      <div className="casino-table-wrap">
        <div className="casino-table-inner casino-felt p-3 sm:p-4">
          <div className="rounded-lg border border-white/10 bg-black/15 p-4 shadow-inner sm:p-6">
            <div className="mb-4 border-b border-white/10 pb-3 text-center">
              <h2 className="font-display text-3xl tracking-[0.2em] text-amber-200 sm:text-4xl">BLACKJACK</h2>
              <p className="mt-1 font-mono text-[9px] uppercase leading-relaxed tracking-widest text-emerald-100/65 sm:text-[10px]">
                Blackjack pays 3 to 2 · Dealer hits soft 16, stands on 17 · Fresh deck each hand
              </p>
            </div>
        <BlackjackHand
          cards={dealerCards}
          label="Dealer"
          valueText={hideHole ? `Showing ${dealerVal}` : `Total ${handInfo(dealerCards).value}`}
          hideHole={hideHole}
        />
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-vegas-purple/50 to-transparent" />
        <div className="grid gap-3 sm:grid-cols-2">
          {playerHands.map((h, i) => {
            const info = handInfo(h.cards)
            return (
              <BlackjackHand
                key={i}
                cards={h.cards}
                label={playerHands.length > 1 ? `Your hand ${i + 1}` : 'Your hand'}
                valueText={`Total ${info.value}${info.soft ? ' (soft)' : ''}`}
                highlight={i === activeIdx && phase === 'player'}
                animateDeal={animateDeal && i === 0}
              />
            )
          })}
        </div>
            {message && (
              <p className="mt-3 text-center font-mono text-sm font-semibold text-amber-200">{message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          disabled={busy || (phase !== 'idle' && phase !== 'done')}
          onClick={startRound}
          className="btn-neon bg-vegas-purple/25 px-6 py-2 text-white"
        >
          Deal
        </button>
        <button
          type="button"
          disabled={busy || phase !== 'player'}
          onClick={hit}
          className="btn-neon bg-black/40 px-5 py-2 text-vegas-cyan"
        >
          Hit
        </button>
        <button
          type="button"
          disabled={busy || phase !== 'player'}
          onClick={stand}
          className="btn-neon bg-black/40 px-5 py-2 text-vegas-pink"
        >
          Stand
        </button>
        <button
          type="button"
          disabled={!canDouble}
          onClick={doubleDown}
          className="btn-neon bg-black/40 px-5 py-2 text-vegas-gold"
        >
          Double
        </button>
        <button
          type="button"
          disabled={!canSplitNow}
          onClick={split}
          className="btn-neon bg-black/40 px-5 py-2 text-white"
        >
          Split
        </button>
      </div>
    </div>
  )
}
