/** European single-zero layout helpers */

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

/** Wheel pocket order (clockwise from 0) — classic European */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]

export const WHEEL_SEG_DEG = 360 / WHEEL_ORDER.length

/** Center angle (degrees) of pocket at index `i` in SVG space; pointer reads from top (-90°). */
export function pocketCenterAngleDeg(index) {
  return -90 + index * WHEEL_SEG_DEG + WHEEL_SEG_DEG / 2
}

/** Index of winning number on the physical wheel order */
export function wheelIndexForNumber(n) {
  return Math.max(0, WHEEL_ORDER.indexOf(n))
}

/** Wheel rotation (deg, CW) so pocket `index` sits under a fixed top pointer. */
export function wheelRotationForPocket(index, extraFullTurns, currentRotation = 0) {
  const pocketCenter = pocketCenterAngleDeg(index)
  const delta = ((-90 - pocketCenter) % 360 + 360) % 360
  return currentRotation + extraFullTurns * 360 + delta
}

export function getNumberColor(n) {
  if (n === 0) return 'green'
  return RED_NUMBERS.has(n) ? 'red' : 'black'
}

export function getDozen(n) {
  if (n === 0) return null
  if (n >= 1 && n <= 12) return 1
  if (n >= 13 && n <= 24) return 2
  return 3
}

/** Column 1: 1,4,7,...  Column 2: 2,5,8,...  Column 3: 3,6,9,... */
export function getColumn(n) {
  if (n === 0) return null
  return ((n - 1) % 3) + 1
}

/**
 * bets: Map or object keys like:
 *  straight:n, red, black, odd, even, dozen:1|2|3, column:1|2|3
 * values: total chip amount on that spot
 */
export function settleRoulette(winningNumber, betsMap) {
  const color = getNumberColor(winningNumber)
  const dozen = getDozen(winningNumber)
  const column = getColumn(winningNumber)
  const isOdd = winningNumber !== 0 && winningNumber % 2 === 1
  const isEven = winningNumber !== 0 && winningNumber % 2 === 0

  let payout = 0
  const entries = Object.entries(betsMap || {})

  for (const [key, amount] of entries) {
    const a = Number(amount) || 0
    if (a <= 0) continue

    if (key.startsWith('straight:')) {
      const num = Number(key.split(':')[1])
      if (num === winningNumber) payout += a + a * 35
    } else if (key === 'red' && color === 'red') {
      payout += a + a * 1
    } else if (key === 'black' && color === 'black') {
      payout += a + a * 1
    } else if (key === 'odd' && isOdd) {
      payout += a + a * 1
    } else if (key === 'even' && isEven) {
      payout += a + a * 1
    } else if (key.startsWith('dozen:')) {
      const d = Number(key.split(':')[1])
      if (dozen === d) payout += a + a * 2
    } else if (key.startsWith('column:')) {
      const c = Number(key.split(':')[1])
      if (column === c) payout += a + a * 2
    }
  }

  return payout
}

export function totalBetAmount(betsMap) {
  return Object.values(betsMap || {}).reduce((s, v) => s + (Number(v) || 0), 0)
}
