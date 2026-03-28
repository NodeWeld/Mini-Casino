import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'mini-casino-balance-v1'
const TX_KEY = 'mini-casino-tx-v1'
const START = 1000

const BalanceContext = createContext(null)

function loadBalance() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v == null) return START
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : START
  } catch {
    return START
  }
}

function loadTx() {
  try {
    const v = localStorage.getItem(TX_KEY)
    if (!v) return []
    const arr = JSON.parse(v)
    return Array.isArray(arr) ? arr.slice(0, 20) : []
  } catch {
    return []
  }
}

export function BalanceProvider({ children }) {
  const [balance, setBalance] = useState(loadBalance)
  const [transactions, setTransactions] = useState(loadTx)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(balance))
  }, [balance])

  useEffect(() => {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions))
  }, [transactions])

  const logTx = useCallback((entry) => {
    setTransactions((prev) => {
      const next = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          at: Date.now(),
          ...entry,
        },
        ...prev,
      ]
      return next.slice(0, 20)
    })
  }, [])

  const adjust = useCallback(
    (delta, meta = {}) => {
      setBalance((b) => {
        const next = Math.max(0, b + delta)
        return next
      })
      if (meta.label) {
        logTx({
          game: meta.game ?? '—',
          label: meta.label,
          amount: delta,
        })
      }
    },
    [logTx]
  )

  const value = useMemo(
    () => ({
      balance,
      setBalance,
      transactions,
      logTx,
      adjust,
    }),
    [balance, transactions, logTx, adjust]
  )

  return createElement(BalanceContext.Provider, { value }, children)
}

export function useBalance() {
  const ctx = useContext(BalanceContext)
  if (!ctx) throw new Error('useBalance must be used within BalanceProvider')
  return ctx
}
