const CHIP_COLORS = {
  5: 'from-vegas-cyan to-teal-600 border-cyan-300',
  10: 'from-vegas-pink to-rose-700 border-pink-300',
  25: 'from-emerald-500 to-emerald-900 border-emerald-300',
  50: 'from-vegas-purple to-violet-900 border-violet-300',
  100: 'from-amber-400 to-amber-700 border-amber-200',
}

export default function Chip({ value, small, className = '', onClick, active }) {
  const v = Number(value)
  const grad =
    CHIP_COLORS[v] ||
    'from-zinc-600 to-zinc-800 border-zinc-400'

  const size = small ? 'h-8 w-8 text-[10px]' : 'h-11 w-11 text-xs sm:h-12 sm:w-12 sm:text-sm'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative rounded-full border-2 bg-gradient-to-b font-mono font-bold text-white shadow-md transition-all duration-200 ${size} ${grad} ${
        onClick ? 'cursor-pointer hover:scale-110 hover:shadow-neonCyan' : ''
      } ${active ? 'ring-2 ring-vegas-gold ring-offset-2 ring-offset-[#0a0010] scale-110' : ''} ${className}`}
    >
      <span className="absolute inset-1 rounded-full border border-dashed border-white/40" />
      <span className="relative z-10">${v}</span>
    </button>
  )
}
