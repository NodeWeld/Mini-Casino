import Card from '../Card.jsx'

export default function BlackjackHand({
  cards,
  label,
  valueText,
  hideHole = false,
  animateDeal = false,
  highlight = false,
}) {
  const showSecondDown = hideHole && cards.length > 1

  return (
    <div
      className={`rounded-xl border-2 p-3 transition-all ${
        highlight
          ? 'border-amber-400/90 bg-black/35 shadow-[0_0_20px_rgba(251,191,36,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]'
          : 'border-white/15 bg-black/20 shadow-[inset_0_2px_12px_rgba(0,0,0,0.25)]'
      }`}
    >
      {label && (
        <p className="mb-2 font-display text-xs uppercase tracking-[0.2em] text-amber-200/90 sm:text-sm">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {cards.map((c, i) => (
          <Card
            key={`${c.id}-${i}`}
            rank={c.rank}
            suit={c.suit}
            faceDown={showSecondDown && i === 1}
            dealIndex={animateDeal ? i : 0}
            animate={animateDeal}
          />
        ))}
      </div>
      {valueText != null && (
        <p className="mt-2 font-mono text-sm font-semibold text-amber-100">{valueText}</p>
      )}
    </div>
  )
}
