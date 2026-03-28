const RANK_ORDER = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
}

const JACKS_OR_BETTER = new Set([11, 12, 13, 14])

function rankValue(rank) {
  return RANK_ORDER[rank] ?? 0
}

function sortByRankDesc(cards) {
  return [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank))
}

/** Returns { name, multiplier, rankScore } for Jacks or Better pay table */
export function evaluatePokerHand(cards) {
  if (!cards || cards.length !== 5) {
    return { name: '—', multiplier: 0, rankScore: 0 }
  }

  const ranks = cards.map((c) => rankValue(c.rank))
  const suits = cards.map((c) => c.suit)
  const rankCounts = {}
  for (const r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a)
  const isFlush = suits.every((s) => s === suits[0])

  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b)
  let isStraight = false
  let straightHigh = 0

  if (uniqueRanks.length === 5) {
    const min = uniqueRanks[0]
    const max = uniqueRanks[4]
    if (max - min === 4) {
      isStraight = true
      straightHigh = max
    }
    // Wheel A-2-3-4-5
    if (
      uniqueRanks[0] === 2 &&
      uniqueRanks[1] === 3 &&
      uniqueRanks[2] === 4 &&
      uniqueRanks[3] === 5 &&
      uniqueRanks[4] === 14
    ) {
      isStraight = true
      straightHigh = 5
    }
  }

  const isRoyal =
    isFlush &&
    isStraight &&
    uniqueRanks.includes(14) &&
    uniqueRanks.includes(13) &&
    uniqueRanks.includes(12) &&
    uniqueRanks.includes(11) &&
    uniqueRanks.includes(10)

  if (isRoyal) {
    return { name: 'Royal Flush', multiplier: 250, rankScore: 900 }
  }
  if (isFlush && isStraight) {
    return { name: 'Straight Flush', multiplier: 50, rankScore: 800 + straightHigh }
  }
  if (counts[0] === 4) {
    return { name: 'Four of a Kind', multiplier: 25, rankScore: 700 }
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return { name: 'Full House', multiplier: 9, rankScore: 600 }
  }
  if (isFlush) {
    return { name: 'Flush', multiplier: 6, rankScore: 500 }
  }
  if (isStraight) {
    return { name: 'Straight', multiplier: 4, rankScore: 400 + straightHigh }
  }
  if (counts[0] === 3) {
    return { name: 'Three of a Kind', multiplier: 3, rankScore: 300 }
  }
  if (counts[0] === 2 && counts[1] === 2) {
    return { name: 'Two Pair', multiplier: 2, rankScore: 200 }
  }
  if (counts[0] === 2) {
    const pairKey = Object.keys(rankCounts).find((k) => rankCounts[k] === 2)
    const pairRank = Number(pairKey)
    if (JACKS_OR_BETTER.has(pairRank)) {
      return { name: 'Jacks or Better', multiplier: 1, rankScore: 100 + pairRank }
    }
    return { name: 'Low Pair', multiplier: 0, rankScore: 50 }
  }

  return { name: 'Nothing', multiplier: 0, rankScore: 0 }
}

export const PAYOUT_TABLE_ROWS = [
  { name: 'Royal Flush', mult: 250 },
  { name: 'Straight Flush', mult: 50 },
  { name: 'Four of a Kind', mult: 25 },
  { name: 'Full House', mult: 9 },
  { name: 'Flush', mult: 6 },
  { name: 'Straight', mult: 4 },
  { name: 'Three of a Kind', mult: 3 },
  { name: 'Two Pair', mult: 2 },
  { name: 'Jacks or Better', mult: 1 },
]
