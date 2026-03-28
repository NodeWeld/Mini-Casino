import { useCallback, useMemo, useRef } from 'react'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function createDeck() {
  const deck = []
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ rank: r, suit: s, id: `${r}${s}` })
    }
  }
  return deck
}

export function shuffleDeck(deck) {
  const copy = [...deck]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function useDeck() {
  const deckRef = useRef([])

  const freshShuffled = useCallback(() => {
    const d = shuffleDeck(createDeck())
    deckRef.current = d
    return d
  }, [])

  const draw = useCallback((n = 1) => {
    const out = []
    for (let i = 0; i < n; i++) {
      if (deckRef.current.length === 0) {
        deckRef.current = shuffleDeck(createDeck())
      }
      out.push(deckRef.current.pop())
    }
    return out
  }, [])

  const reset = useCallback(() => {
    deckRef.current = shuffleDeck(createDeck())
  }, [])

  return useMemo(
    () => ({ freshShuffled, draw, reset, deckRef }),
    [freshShuffled, draw, reset]
  )
}
