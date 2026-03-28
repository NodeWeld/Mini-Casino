const RED = new Set(['♥', '♦'])

export default function Card({
  rank,
  suit,
  faceDown = false,
  className = '',
  style = {},
  dealIndex = 0,
  animate = false,
}) {
  const red = suit && RED.has(suit)

  if (faceDown) {
    return (
      <div
        className={`playing-card-back relative h-[88px] w-[62px] overflow-hidden rounded-md border border-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.55)] sm:h-[100px] sm:w-[70px] ${animate ? 'card-deal-anim' : ''} ${className}`}
        style={{ animationDelay: `${dealIndex * 0.06}s`, ...style }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: '#1e3a5f',
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.04) 6px, rgba(255,255,255,0.04) 7px),
              repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 7px),
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 55%)
            `,
          }}
        />
        <div className="absolute inset-[5px] rounded-sm border border-amber-700/60 bg-[#0c1929]/90" />
        <div className="absolute inset-[10px] rounded-sm border border-white/10" />
        <span className="absolute inset-0 flex items-center justify-center text-lg text-amber-500/90">♠</span>
      </div>
    )
  }

  return (
    <div
      className={`relative flex h-[88px] w-[62px] flex-col overflow-hidden rounded-md border border-slate-300 bg-gradient-to-br from-white via-white to-slate-100 text-black shadow-[0_4px_14px_rgba(0,0,0,0.35)] sm:h-[100px] sm:w-[70px] ${animate ? 'card-deal-anim' : ''} ${className}`}
      style={{ animationDelay: `${dealIndex * 0.06}s`, ...style }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(125deg, rgba(255,255,255,0.9) 0%, transparent 42%, transparent 58%, rgba(0,0,0,0.04) 100%)',
        }}
      />
      <div
        className={`relative z-[1] flex flex-1 flex-col items-center justify-center px-0.5 font-mono text-sm font-bold leading-none sm:text-base ${red ? 'text-red-600' : 'text-slate-900'}`}
      >
        <span>{rank}</span>
        <span className="text-lg sm:text-xl">{suit}</span>
      </div>
    </div>
  )
}
