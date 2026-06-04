// Web Audio API を使ったサウンドエンジン（音声ファイル不要）

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // モバイルでは最初のユーザー操作後に resume が必要
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  startTime = 0,
) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()

  osc.connect(gain)
  gain.connect(c.destination)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, c.currentTime + startTime)

  gain.gain.setValueAtTime(gainValue, c.currentTime + startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration)

  osc.start(c.currentTime + startTime)
  osc.stop(c.currentTime + startTime + duration)
}

export const sounds = {
  /** 正解音：明るいポン */
  correct() {
    playTone(880, 0.1, 'sine', 0.3)
    playTone(1100, 0.15, 'sine', 0.2, 0.08)
  },

  /** 不正解音：低いブー */
  wrong() {
    playTone(200, 0.2, 'sawtooth', 0.2)
    playTone(160, 0.2, 'sawtooth', 0.15, 0.1)
  },

  /** コンボ音：キラキラ上昇（コンボ数に応じて高くなる） */
  combo(comboCount: number) {
    const base = 600 + comboCount * 40
    playTone(base, 0.08, 'sine', 0.25)
    playTone(base * 1.25, 0.08, 'sine', 0.2, 0.07)
    playTone(base * 1.5, 0.12, 'sine', 0.25, 0.14)
  },

  /** カウントダウン ビープ */
  countdown() {
    playTone(660, 0.15, 'sine', 0.3)
  },

  /** GO! の音：高くて明るい */
  go() {
    playTone(880, 0.1, 'sine', 0.3)
    playTone(1100, 0.1, 'sine', 0.25, 0.1)
    playTone(1320, 0.2, 'sine', 0.3, 0.2)
  },

  /** ゲーム終了：タイムアップ音 */
  timeup() {
    playTone(440, 0.15, 'sine', 0.3)
    playTone(330, 0.15, 'sine', 0.3, 0.15)
    playTone(220, 0.3, 'sine', 0.35, 0.3)
  },

  /** タイマー残り10秒：緊張感のある音 */
  tick() {
    playTone(800, 0.06, 'square', 0.1)
  },
}
