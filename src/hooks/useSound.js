import { useCallback, useRef } from 'react'

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  return new AC()
}

export function useSound() {
  const ctxRef = useRef(null)

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = getCtx()
    return ctxRef.current
  }, [])

  const resume = useCallback(async () => {
    const ctx = ensureCtx()
    if (ctx?.state === 'suspended') await ctx.resume()
  }, [ensureCtx])

  const reelSpin = useCallback(async () => {
    await resume()
    const ctx = ensureCtx()
    if (!ctx) return
    const dur = 0.08
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.25, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
    src.connect(g)
    g.connect(ctx.destination)
    src.start()
  }, [ensureCtx, resume])

  const cardDeal = useCallback(async () => {
    await resume()
    const ctx = ensureCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04)
    g.gain.setValueAtTime(0.12, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.07)
  }, [ensureCtx, resume])

  const win = useCallback(async () => {
    await resume()
    const ctx = ensureCtx()
    if (!ctx) return
    const freqs = [523.25, 659.25, 783.99, 1046.5]
    let t = ctx.currentTime
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, t)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.1, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.2)
      t += 0.08
    })
  }, [ensureCtx, resume])

  const bigWin = useCallback(async () => {
    await resume()
    const ctx = ensureCtx()
    if (!ctx) return
    const t0 = ctx.currentTime
    const chord = [261.63, 329.63, 392.0, 523.25]
    chord.forEach((f) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, t0)
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(0.06, t0 + 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 1)
    })
  }, [ensureCtx, resume])

  const lose = useCallback(async () => {
    await resume()
    const ctx = ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, t)
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.2)
    g.gain.setValueAtTime(0.2, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  }, [ensureCtx, resume])

  return { reelSpin, cardDeal, win, bigWin, lose, resume }
}
