import Card from '../Card.jsx'

export default function PokerHand({ cards, held, onToggleHold, disabled, animateDeal }) {
  if (!cards?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {cards.map((c, i) => {
        const isHeld = held[i]
        return (
          <button
            key={`${c.id}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => onToggleHold?.(i)}
            className={`relative rounded-md transition-all ${
              isHeld
                ? 'ring-2 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
                : 'ring-1 ring-black/40 shadow-md'
            } ${disabled ? 'cursor-default' : 'cursor-pointer hover:ring-amber-200/60'}`}
          >
            <Card rank={c.rank} suit={c.suit} animate={animateDeal} dealIndex={i} />
            {isHeld && (
              <span className="absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm border border-amber-900 bg-gradient-to-b from-amber-400 to-amber-600 px-2 py-0.5 font-display text-[10px] font-bold tracking-widest text-black shadow-md">
                HELD
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
