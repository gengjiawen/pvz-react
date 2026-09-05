export type SoundName =
  | 'collect' | 'plant' | 'shoot' | 'hit' | 'kill' | 'explode' | 'wave'
  | 'mower' | 'bite' | 'shovel' | 'chomp' | 'click' | 'win' | 'lose'

interface AudioSettings {
  sound: boolean
  music: boolean
}

/** Every sound is synthesised on the fly — the game ships no audio files. */
export class GardenAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private step = 0
  private next = 0

  /** Whether the background loop should be playing right now. */
  active = false

  private settings: AudioSettings

  constructor(settings: AudioSettings) {
    this.settings = settings
  }

  setSettings(settings: AudioSettings) {
    this.settings = settings
  }

  /** Must be called from a user gesture; browsers start contexts suspended. */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
      return
    }
    if (typeof AudioContext === 'undefined') return
    try {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.34
      this.master.connect(this.ctx.destination)
      this.timer = setInterval(() => this.schedule(), 110)
    } catch {
      this.ctx = null
    }
  }

  dispose() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.active = false
    void this.ctx?.close().catch(() => {})
    this.ctx = null
    this.master = null
  }

  private tone(
    freq: number,
    duration = 0.1,
    volume = 0.12,
    type: OscillatorType = 'sine',
    delay = 0,
    endFreq?: number,
  ) {
    const c = this.ctx
    if (!c || !this.master || !this.settings.sound) return
    const at = c.currentTime + delay
    const osc = c.createOscillator()
    const gain = c.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), at + duration)

    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), at + 0.007)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)

    osc.connect(gain)
    gain.connect(this.master)
    osc.start(at)
    osc.stop(at + duration + 0.02)
  }

  private noise(duration = 0.2, volume = 0.07, cutoff = 700) {
    const c = this.ctx
    if (!c || !this.master || !this.settings.sound) return
    const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2
    }
    const src = c.createBufferSource()
    src.buffer = buffer
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const gain = c.createGain()
    gain.gain.value = volume
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
  }

  effect(name: string) {
    switch (name as SoundName) {
      case 'collect':
        this.tone(880, 0.13, 0.2, 'sine')
        this.tone(1318, 0.2, 0.12, 'sine', 0.07)
        break
      case 'plant':
        this.noise(0.11, 0.2, 550)
        this.tone(250, 0.1, 0.15, 'sine', 0, 110)
        break
      case 'shoot':
        this.tone(440, 0.065, 0.055, 'sine', 0, 190)
        break
      case 'hit':
        this.noise(0.055, 0.045, 1100)
        break
      case 'kill':
        this.tone(140, 0.2, 0.06, 'triangle', 0, 65)
        break
      case 'explode':
        this.noise(0.65, 0.7, 800)
        this.tone(95, 0.4, 0.35, 'sine', 0, 30)
        break
      case 'wave':
        for (const [i, f] of [196, 196, 155].entries()) this.tone(f, 0.27, 0.09, 'triangle', i * 0.24)
        break
      case 'mower':
        this.noise(0.9, 0.4, 450)
        this.tone(75, 0.7, 0.2, 'sawtooth', 0, 130)
        break
      case 'bite':
        this.noise(0.05, 0.023, 650)
        break
      case 'shovel':
        this.noise(0.16, 0.17, 1800)
        break
      case 'chomp':
        this.tone(230, 0.22, 0.2, 'triangle', 0, 55)
        this.noise(0.13, 0.2, 800)
        break
      case 'click':
        this.tone(650, 0.04, 0.07, 'sine')
        break
      case 'win':
        for (const [i, f] of [523, 659, 784, 1047, 988, 1047].entries()) this.tone(f, 0.35, 0.15, 'triangle', i * 0.15)
        break
      case 'lose':
        for (const [i, f] of [330, 311, 294, 196].entries()) this.tone(f, 0.5, 0.1, 'triangle', i * 0.22)
        break
      default:
        break
    }
  }

  /** Keeps the looping melody a quarter-second ahead of the playback clock. */
  private schedule() {
    const c = this.ctx
    if (!c || !this.active || !this.settings.sound || !this.settings.music) return
    if (this.next < c.currentTime) this.next = c.currentTime + 0.03

    const melody = [72, 0, 76, 79, 76, 0, 74, 0, 71, 0, 74, 77, 74, 0, 72, 0, 69, 0, 72, 76, 72, 74, 76, 0, 67, 0, 71, 74, 71, 0, 67, 0]
    const midi = (note: number) => 440 * Math.pow(2, (note - 69) / 12)

    while (this.next < c.currentTime + 0.25) {
      const step = this.step % 32
      const note = melody[step]
      const delay = this.next - c.currentTime
      if (note) this.tone(midi(note), 0.17, 0.028, 'sine', delay)
      if (step % 4 === 0) {
        const bass = [48, 43, 45, 43][Math.floor(step / 8)]
        this.tone(midi(bass), 0.32, 0.045, 'triangle', delay)
      }
      this.step++
      this.next += 0.225
    }
  }
}
