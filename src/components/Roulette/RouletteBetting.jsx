import { getNumberColor } from '../../utils/rouletteLogic.js'

const ROW1 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]
const ROW2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35]
const ROW3 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]

function Cell({ n, bets, onAdd, disabled }) {
  const key = `straight:${n}`
  const total = bets[key] || 0
  const col = getNumberColor(n)
  const bg =
    col === 'green'
      ? 'bg-[#0f5132]'
      : col === 'red'
        ? 'bg-[#7f1d1d]'
        : 'bg-[#18181b]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(key)}
      className={`relative min-h-[30px] border border-white/90 font-mono text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:brightness-110 active:scale-[0.98] sm:min-h-[34px] sm:text-xs ${bg} ${disabled ? 'opacity-40' : ''}`}
      style={{
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {n}
      {total > 0 && (
        <span className="absolute bottom-0.5 right-0.5 rounded-sm bg-amber-400 px-0.5 font-mono text-[9px] font-bold text-black shadow-sm">
          ${total}
        </span>
      )}
    </button>
  )
}

function OutsideBtn({ label, k, bets, onAdd, disabled, className = '' }) {
  const total = bets[k] || 0
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(k)}
      className={`relative border-2 border-white/90 bg-[#0a1628] px-1 py-2 font-display text-[11px] font-semibold tracking-wide text-amber-100 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)] transition-all hover:brightness-125 sm:text-sm ${className} ${disabled ? 'opacity-40' : ''}`}
    >
      {label}
      {total > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1 font-mono text-[8px] font-bold text-black">
          ${total}
        </span>
      )}
    </button>
  )
}

export default function RouletteBetting({ bets, onAdd, disabled }) {
  return (
    <div className="casino-table-wrap mx-auto max-w-2xl">
      <div className="casino-table-inner casino-felt p-3 sm:p-4">
        <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-widest text-emerald-100/70">
          Place chips on the layout
        </p>
        <div className="flex gap-1 sm:gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAdd('straight:0')}
            className={`flex w-10 shrink-0 flex-col items-center justify-center border-2 border-white/90 bg-[#14532d] font-mono text-sm font-bold text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] transition-all hover:brightness-110 sm:w-12 ${disabled ? 'opacity-40' : ''}`}
          >
            0
            {(bets['straight:0'] || 0) > 0 && (
              <span className="text-[9px] font-bold text-amber-300">${bets['straight:0']}</span>
            )}
          </button>
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-0 sm:gap-px">
              {ROW1.map((n) => (
                <Cell key={n} n={n} bets={bets} onAdd={onAdd} disabled={disabled} />
              ))}
              <OutsideBtn
                label="2:1"
                k="column:3"
                bets={bets}
                onAdd={onAdd}
                disabled={disabled}
                className="min-h-[30px] py-3 sm:min-h-[34px]"
              />
            </div>
            <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-0 sm:gap-px">
              {ROW2.map((n) => (
                <Cell key={n} n={n} bets={bets} onAdd={onAdd} disabled={disabled} />
              ))}
              <OutsideBtn
                label="2:1"
                k="column:2"
                bets={bets}
                onAdd={onAdd}
                disabled={disabled}
                className="min-h-[30px] py-3 sm:min-h-[34px]"
              />
            </div>
            <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-0 sm:gap-px">
              {ROW3.map((n) => (
                <Cell key={n} n={n} bets={bets} onAdd={onAdd} disabled={disabled} />
              ))}
              <OutsideBtn
                label="2:1"
                k="column:1"
                bets={bets}
                onAdd={onAdd}
                disabled={disabled}
                className="min-h-[30px] py-3 sm:min-h-[34px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-px pt-1">
              <OutsideBtn label="1st 12" k="dozen:1" bets={bets} onAdd={onAdd} disabled={disabled} />
              <OutsideBtn label="2nd 12" k="dozen:2" bets={bets} onAdd={onAdd} disabled={disabled} />
              <OutsideBtn label="3rd 12" k="dozen:3" bets={bets} onAdd={onAdd} disabled={disabled} />
            </div>
            <div className="grid grid-cols-4 gap-px pt-1">
              <OutsideBtn label="EVEN" k="even" bets={bets} onAdd={onAdd} disabled={disabled} />
              <OutsideBtn label="RED" k="red" bets={bets} onAdd={onAdd} disabled={disabled} className="!bg-[#450a0a]" />
              <OutsideBtn label="BLACK" k="black" bets={bets} onAdd={onAdd} disabled={disabled} className="!bg-[#09090b]" />
              <OutsideBtn label="ODD" k="odd" bets={bets} onAdd={onAdd} disabled={disabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
