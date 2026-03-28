import { useCallback, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useBalance } from './hooks/useBalance.js'
import { useSound } from './hooks/useSound.js'
import Chip from './components/Chip.jsx'
import SlotMachine from './components/SlotMachine/SlotMachine.jsx'
import Blackjack from './components/Blackjack/Blackjack.jsx'
import Roulette from './components/Roulette/Roulette.jsx'
import VideoPoker from './components/Poker/VideoPoker.jsx'

const CHIPS = [5, 10, 25, 50, 100]

function Sparkles({ active }) {
  const items = useMemo(
    () =>
      active
        ? Array.from({ length: 28 }, (_, i) => ({
            id: i,
            left: `${8 + Math.random() * 84}%`,
            top: `${8 + Math.random() * 84}%`,
            delay: `${Math.random() * 0.4}s`,
            sx: `${(Math.random() - 0.5) * 40}px`,
            sy: `${(Math.random() - 0.5) * 40}px`,
          }))
        : [],
    [active]
  )
  if (!active) return null
  return (
    <div className="sparkle-layer" aria-hidden>
      {items.map((s) => (
        <span
          key={s.id}
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            ['--sx']: s.sx,
            ['--sy']: s.sy,
          }}
        />
      ))}
    </div>
  )
}

function formatTx(t) {
  const sign = t.amount >= 0 ? '+' : ''
  return `${sign}$${Math.abs(t.amount)}`
}

export default function App() {
  const { balance, transactions } = useBalance()
  const { resume } = useSound()
  const [betAmount, setBetAmount] = useState(10)
  const [busy, setBusy] = useState(false)
  const [insufficient, setInsufficient] = useState(false)
  const [floatWin, setFloatWin] = useState(null)
  const [balanceFlash, setBalanceFlash] = useState(null)
  const [sparkles, setSparkles] = useState(false)
  const location = useLocation()

  const onWinFloat = useCallback((amount) => {
    setFloatWin(amount)
    setTimeout(() => setFloatWin(null), 1200)
  }, [])

  const onBalanceFlash = useCallback((kind) => {
    setBalanceFlash(kind)
    setTimeout(() => setBalanceFlash(null), 600)
  }, [])

  const triggerSparkles = useCallback(() => {
    setSparkles(true)
    setTimeout(() => setSparkles(false), 1200)
  }, [])

  const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 font-display text-lg tracking-wide transition-all sm:px-4 sm:text-xl ${
      isActive
        ? 'neon-border-active bg-vegas-purple/25 text-vegas-gold shadow-neonGold'
        : 'text-vegas-cyan/90 hover:text-vegas-pink hover:shadow-neonPink'
    }`

  return (
    <div className="min-h-screen bg-[#0a0010] pb-24 pt-2 sm:pb-8">
      <Sparkles active={sparkles} />

      <header className="sticky top-0 z-40 border-b border-vegas-purple/30 bg-[#0a0010]/95 px-2 py-3 backdrop-blur-sm sm:px-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <NavLink to="/slots" className={navClass} onClick={() => resume()}>
              Slots
            </NavLink>
            <NavLink to="/blackjack" className={navClass} onClick={() => resume()}>
              Blackjack
            </NavLink>
            <NavLink to="/roulette" className={navClass} onClick={() => resume()}>
              Roulette
            </NavLink>
            <NavLink to="/poker" className={navClass} onClick={() => resume()}>
              Poker
            </NavLink>
          </div>
          <div
            className={`flex items-center justify-center gap-3 font-mono text-xl sm:text-2xl ${
              balanceFlash === 'win' ? 'balance-flash-win' : ''
            } ${balanceFlash === 'lose' ? 'balance-flash-lose' : ''}`}
          >
            <span className="text-vegas-cyan/80">Balance</span>
            <span className="text-vegas-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]">
              ${balance.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {insufficient && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg border-2 border-vegas-pink bg-black/90 px-4 py-2 font-mono text-vegas-pink shadow-neonPink">
          Insufficient funds
        </div>
      )}

      {floatWin != null && (
        <div className="pointer-events-none fixed left-1/2 top-1/3 z-50 -translate-x-1/2 animate-float-win font-mono text-2xl font-bold text-vegas-gold drop-shadow-[0_0_12px_#ffd700]">
          +${floatWin}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
        <section className="mb-6 rounded-2xl border border-vegas-purple/35 bg-gradient-to-br from-black/60 to-violet-950/30 p-4 shadow-neonPurple sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 font-display text-xl tracking-wider text-vegas-pink">Bet / chip value</p>
              <div className="flex flex-wrap gap-2">
                {CHIPS.map((v) => (
                  <Chip
                    key={v}
                    value={v}
                    active={betAmount === v}
                    onClick={() => {
                      setBetAmount(v)
                    }}
                    className="animate-chip-toss"
                  />
                ))}
              </div>
              <p className="mt-2 font-mono text-sm text-vegas-cyan/80">
                Selected: <span className="text-vegas-gold">${betAmount}</span>
                {location.pathname === '/roulette' && (
                  <span className="text-vegas-cyan/60"> · add to felt by tapping the board</span>
                )}
              </p>
            </div>
            <div className="flex min-w-[140px] flex-col items-center">
              <p className="font-display text-sm text-vegas-cyan/80">Stack</p>
              <div className="mt-1 flex -space-x-3">
                {betAmount > 0 &&
                  [0, 1, 2].map((i) => (
                    <div key={i} className="relative" style={{ zIndex: 3 - i }}>
                      <Chip value={betAmount} small />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <Routes>
          <Route path="/" element={<Navigate to="/slots" replace />} />
          <Route
            path="/slots"
            element={
              <SlotMachine
                betAmount={betAmount}
                setInsufficient={setInsufficient}
                busy={busy}
                setBusy={setBusy}
                onWinFloat={onWinFloat}
                onBalanceFlash={onBalanceFlash}
                triggerSparkles={triggerSparkles}
              />
            }
          />
          <Route
            path="/blackjack"
            element={
              <Blackjack
                betAmount={betAmount}
                setInsufficient={setInsufficient}
                busy={busy}
                setBusy={setBusy}
                onWinFloat={onWinFloat}
                onBalanceFlash={onBalanceFlash}
                triggerSparkles={triggerSparkles}
              />
            }
          />
          <Route
            path="/roulette"
            element={
              <Roulette
                betAmount={betAmount}
                setInsufficient={setInsufficient}
                busy={busy}
                setBusy={setBusy}
                onWinFloat={onWinFloat}
                onBalanceFlash={onBalanceFlash}
                triggerSparkles={triggerSparkles}
              />
            }
          />
          <Route
            path="/poker"
            element={
              <VideoPoker
                betAmount={betAmount}
                setInsufficient={setInsufficient}
                busy={busy}
                setBusy={setBusy}
                onWinFloat={onWinFloat}
                onBalanceFlash={onBalanceFlash}
                triggerSparkles={triggerSparkles}
              />
            }
          />
          <Route path="*" element={<Navigate to="/slots" replace />} />
        </Routes>

        <aside className="mt-10 rounded-2xl border border-vegas-cyan/25 bg-black/40 p-4">
          <h3 className="mb-3 font-display text-2xl text-vegas-gold">Transaction log</h3>
          <ul className="max-h-48 space-y-1 overflow-y-auto font-mono text-sm">
            {transactions.length === 0 && (
              <li className="text-vegas-cyan/50">No bets yet — good luck!</li>
            )}
            {transactions.map((t) => (
              <li
                key={t.id}
                className={`flex flex-wrap justify-between gap-2 border-b border-white/5 py-1 ${
                  t.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span className="text-vegas-cyan/70">{t.game}</span>
                <span>{t.label}</span>
                <span>{formatTx(t)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-6 text-center font-mono text-xs text-vegas-purple/60">
        Mini Casino · client-side entertainment only · 18+
      </footer>
    </div>
  )
}
