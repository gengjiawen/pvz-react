import { GardenAudio } from '../game/GardenAudio'
import { GardenRenderer } from '../game/GardenRenderer'
import { LawnGame } from '../game/LawnGame'
import { FIELD, LEVELS, PLANTS, cellAt, center } from '../game/config'
import type { EndSummary, GameEvent, PlantType } from '../game/types'
import type { Settings } from '../store/appStore'
import { useAppStore } from '../store/appStore'
import { useGameStore } from '../store/gameStore'
import type { Selection } from '../store/gameStore'

const STEP = 1 / 60
/** How often the React HUD is refreshed — the canvas still runs at full rate. */
const HUD_INTERVAL = 0.09

/**
 * Glue between the framework-free simulation and React. It owns the rAF loop
 * and every piece of mutable per-frame state, and pushes a throttled HUD
 * snapshot into `useGameStore`. Components call its methods to act on the game.
 */
export class GameController {
  readonly renderer: GardenRenderer
  readonly audio: GardenAudio

  private readonly canvas: HTMLCanvasElement
  private game: LawnGame | null = null
  private settings: Settings
  private previewLevel = 0
  private previewEndless = false

  private paused = false
  private suspended = false
  private speed: 1 | 2 = 1
  private selected: Selection = null
  private hover: { row: number; col: number } | null = null
  private keyboardCell = { row: 2, col: 0 }

  private raf = 0
  private lastTime = 0
  private accumulator = 0
  private hudTime = 0
  private endTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.canvas = canvas
    this.settings = settings
    this.renderer = new GardenRenderer(canvas)
    this.audio = new GardenAudio(settings)
    this.renderer.reduced = settings.reduced || this.renderer.reduced
  }

  private get app() {
    return useAppStore.getState()
  }

  // ---------------------------------------------------------------- store sync

  private pushHud() {
    const game = this.game
    const level = game ? game.level : this.previewLevel
    const endless = game ? game.endless : this.previewEndless
    const config = LEVELS[Math.min(level, LEVELS.length - 1)]

    let progress = 0
    if (game) {
      progress = game.endless
        ? ((game.time - 15) % 35) / 35
        : Math.max(0, Math.min(1, (game.time - 15) / (config.gap * (game.waveTotal - 1) + 10)))
    }

    useGameStore.setState({
      ready: this.renderer.loaded,
      running: !!game,
      status: game ? game.state : 'playing',
      paused: this.paused,
      suspended: this.suspended,
      speed: this.speed,
      selected: this.selected,
      sun: game ? game.sun : config.initial,
      cooldowns: game ? game.cooldowns : Array(PLANTS.length).fill(0),
      level,
      endless,
      time: game ? game.time : 0,
      kills: game ? game.kills : 0,
      wave: game ? game.wave : 0,
      waveTotal: game ? game.waveTotal : config.waves,
      waveCountdown: game ? game.waveCountdown : 15,
      progress,
    })
  }

  // ---------------------------------------------------------------- lifecycle

  async load() {
    await this.renderer.load()
    if (this.disposed) return
    this.pushHud()
    this.raf = requestAnimationFrame(this.frame)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    if (this.endTimer) clearTimeout(this.endTimer)
    this.audio.dispose()
  }

  setSettings(settings: Settings) {
    this.settings = settings
    this.audio.setSettings(settings)
    this.renderer.reduced = settings.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches
    if (this.game) this.game.autoCollect = settings.auto
  }

  /** Level/mode chosen on the home screen, before a run exists. */
  setPreview(level: number, endless: boolean) {
    this.previewLevel = level
    this.previewEndless = endless
    this.pushHud()
  }

  // ---------------------------------------------------------------- commands

  start(level: number, endless: boolean) {
    if (this.endTimer) clearTimeout(this.endTimer)
    this.previewLevel = level
    this.previewEndless = endless
    this.game = new LawnGame({ level, endless, autoCollect: this.settings.auto })
    this.paused = false
    this.suspended = false
    this.speed = 1
    this.selected = 0
    this.hover = null
    this.accumulator = 0
    this.renderer.reset()
    this.audio.init()
    this.audio.active = true

    const app = this.app
    app.setResult(null)
    app.closeModal()
    app.showBanner('准备 · 种植 · 保卫！', 'READY. SET. PLANT.', 2000)
    app.showToast('先种向日葵收集阳光，再用豌豆射手守住各行。', 6000)
    this.canvas.focus({ preventScroll: true })
    this.pushHud()
  }

  home() {
    if (this.endTimer) clearTimeout(this.endTimer)
    this.game = null
    this.paused = false
    this.suspended = false
    this.selected = null
    this.hover = null
    this.audio.active = false
    this.renderer.reset()
    this.app.setResult(null)
    this.pushHud()
  }

  restart() {
    if (this.game) this.start(this.game.level, this.game.endless)
  }

  togglePause() {
    if (!this.game || this.game.state !== 'playing' || this.suspended) return
    this.paused = !this.paused
    this.audio.active = !this.paused
    if (!this.paused) this.canvas.focus({ preventScroll: true })
    this.pushHud()
  }

  /** Halts the run while a modal is open, without showing the pause card. */
  suspend() {
    if (this.suspended || !this.game) return
    this.suspended = true
    this.audio.active = false
    this.pushHud()
  }

  unsuspend() {
    if (!this.suspended) return
    this.suspended = false
    this.audio.active = !this.paused && !!this.game && this.game.state === 'playing'
    this.pushHud()
  }

  toggleSpeed() {
    if (!this.game || this.paused) return
    this.speed = this.speed === 1 ? 2 : 1
    this.app.showToast(this.speed === 2 ? '双倍速度，火力全开！' : '已恢复正常速度')
    this.pushHud()
  }

  selectPlant(index: PlantType) {
    this.audio.init()
    this.audio.effect('click')
    if (!this.game) {
      this.app.showToast('点击「开始保卫庭院」，让种子发芽吧')
      return
    }
    if (this.paused || this.game.state !== 'playing') return

    const def = PLANTS[index]
    if (this.game.sun < def.cost) {
      this.app.showToast(`${def.name}需要 ${def.cost} 阳光`)
      return
    }
    if (this.game.cooldowns[index] > 0) {
      this.app.showToast(`种子还需 ${Math.ceil(this.game.cooldowns[index])} 秒准备`)
      return
    }
    this.selected = this.selected === index ? null : index
    this.pushHud()
  }

  selectShovel() {
    if (!this.game) {
      this.app.showToast('开始游戏后可以使用铲子')
      return
    }
    if (this.paused || this.game.state !== 'playing') return
    this.selected = this.selected === 'shovel' ? null : 'shovel'
    this.audio.effect('click')
    this.pushHud()
  }

  clearSelection() {
    if (this.selected === null) return false
    this.selected = null
    this.pushHud()
    return true
  }

  collectAll() {
    if (!this.game) return
    for (const sun of [...this.game.suns]) this.game.collect(sun.id)
    this.drainEvents()
    this.pushHud()
  }

  toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
      else this.app.showToast('此浏览器不支持全屏，可使用横屏游玩')
    } catch {
      this.app.showToast('当前窗口不支持全屏，可在浏览器中打开')
    }
  }

  // ---------------------------------------------------------------- pointer & board

  /** Converts a pointer event into the canvas' fixed 1440 × 810 space. */
  private toCanvas(event: { clientX: number; clientY: number }) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.w,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.h,
    }
  }

  pointerMove(event: { clientX: number; clientY: number }) {
    if (!this.game || this.paused) return
    const p = this.toCanvas(event)
    this.hover = cellAt(p)
    const overSun = !!this.game.sunAt(p.x, p.y)
    this.canvas.style.cursor = overSun ? 'pointer' : this.selected !== null ? 'crosshair' : 'default'
  }

  pointerLeave() {
    this.hover = null
  }

  pointerDown(event: { clientX: number; clientY: number; shiftKey: boolean }) {
    this.audio.init()
    if (!this.game) return
    this.canvas.focus({ preventScroll: true })
    this.interact(this.toCanvas(event), event.shiftKey)
  }

  moveKeyboardCell(dRow: number, dCol: number) {
    this.keyboardCell = {
      row: Math.min(FIELD.rows - 1, Math.max(0, this.keyboardCell.row + dRow)),
      col: Math.min(FIELD.cols - 1, Math.max(0, this.keyboardCell.col + dCol)),
    }
    this.hover = { ...this.keyboardCell }
    this.canvas.focus({ preventScroll: true })
    this.app.announce(`第 ${this.hover.row + 1} 行，第 ${this.hover.col + 1} 列`)
  }

  interactAtKeyboardCell(shift: boolean) {
    this.interact(center(this.keyboardCell.row, this.keyboardCell.col), shift)
  }

  private interact(p: { x: number; y: number }, shift = false) {
    const game = this.game
    if (!game || this.paused || this.suspended || game.state !== 'playing') return

    const sun = game.sunAt(p.x, p.y)
    if (sun) {
      game.collect(sun.id)
      this.drainEvents()
      this.pushHud()
      return
    }

    const cell = cellAt(p)
    if (!cell) return
    this.keyboardCell = cell

    if (this.selected === 'shovel') {
      if (game.shovel(cell.row, cell.col)) {
        if (!shift) this.selected = null
      } else {
        this.app.showToast('这里没有需要铲除的植物')
      }
    } else if (this.selected !== null) {
      if (game.plant(this.selected, cell.row, cell.col) && !shift) this.selected = null
    } else {
      this.app.showToast('先点击上方植物卡，或按数字 1–8 选择植物。')
    }

    this.drainEvents()
    this.pushHud()
  }

  // ---------------------------------------------------------------- loop

  private drainEvents() {
    const game = this.game
    if (!game) return
    const batch = game.events.splice(0)
    // Dozens of peas can land in one frame; one impact sound is plenty.
    let hitPlayed = false

    for (const e of batch) {
      this.renderer.event(e)
      if (e.type === 'hit') {
        if (!hitPlayed) {
          this.audio.effect('hit')
          hitPlayed = true
        }
      } else {
        this.audio.effect(e.type)
      }
      this.handleUiEvent(e, game)
    }
  }

  private handleUiEvent(e: GameEvent, game: LawnGame) {
    const app = this.app
    switch (e.type) {
      case 'hint':
        app.showToast(e.text)
        break
      case 'wave':
        app.showBanner(
          e.final ? '一大波僵尸正在接近！' : `第 ${e.wave} 波 · 僵尸来袭`,
          e.final ? 'FINAL WAVE' : '守住你的每一条防线',
          3000,
        )
        break
      case 'mower':
        app.showToast('割草机出动！这一行失去了最后的保险。', 3500)
        break
      case 'end': {
        this.audio.active = false
        this.selected = null
        if (e.won) this.renderer.event({ type: 'win' })
        this.audio.effect(e.won ? 'win' : 'lose')

        const summary: EndSummary = {
          won: e.won,
          level: game.level,
          endless: game.endless,
          wave: game.wave,
          score: game.score,
          kills: game.kills,
          planted: game.planted,
          stars: game.stars,
        }
        app.saveResult(summary)
        // Let the confetti or the last groan land before the card appears.
        this.endTimer = setTimeout(
          () => {
            if (this.game === game) this.app.setResult(summary)
          },
          e.won ? 800 : 350,
        )
        break
      }
      default:
        break
    }
  }

  private frame = (timestamp: number) => {
    const realDt = this.lastTime ? Math.min((timestamp - this.lastTime) / 1000, 0.08) : 0
    this.lastTime = timestamp
    const game = this.game
    const live = !!game && !this.paused && !this.suspended && game.state === 'playing'

    if (live && game) {
      this.accumulator += realDt * this.speed
      let loops = 0
      // Cap the catch-up so a stalled tab cannot spiral into a long freeze.
      while (this.accumulator >= STEP && loops < 12) {
        game.update(STEP)
        this.accumulator -= STEP
        loops++
      }
      this.drainEvents()
    }

    this.renderer.render(game, { selected: this.selected, hover: this.hover }, live ? realDt : 0)

    if (game) {
      this.hudTime += realDt
      if (this.hudTime > HUD_INTERVAL) {
        this.hudTime = 0
        this.pushHud()
      }
    }

    this.raf = requestAnimationFrame(this.frame)
  }

  /** A backgrounded tab stalls rAF; drop the accumulated delta on the way back. */
  handleVisibilityChange(hidden: boolean) {
    this.lastTime = 0
    if (hidden && this.game && this.game.state === 'playing' && !this.paused && !this.suspended) {
      this.togglePause()
    }
  }
}
