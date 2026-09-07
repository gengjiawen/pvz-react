import gardenUrl from '../assets/garden.png'
import spritesUrl from '../assets/sprites.png'
import zombieAnimationsUrl from '../assets/zombie-animations.png'
import { FIELD, PLANTS, P_CHERRY, P_CHOMPER, P_MINE, P_SUNFLOWER, P_WALLNUT, SPRITE_RECTS, ZOMBIES, cellBounds, center } from './config'
import type { LawnGame } from './LawnGame'
import type { GameEvent, Mower, Plant, PlantType, Zombie, ZombieKind } from './types'
import { ZOMBIE_FRAMES, zombieFrame } from './zombieAnimation'

/** What the renderer needs to draw an entity — real ones, ghosts and demo props alike. */
type RenderPlant = Pick<Plant, 'type' | 'x' | 'y' | 'hp' | 'maxHp'> & Partial<Plant>
type RenderZombie = Pick<Zombie, 'type' | 'x' | 'y' | 'hp' | 'maxHp' | 'row'> & Partial<Zombie>

export interface RenderUi {
  selected: PlantType | 'shovel' | null
  hover: { row: number; col: number } | null
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  rotate: number
  confetti?: boolean
}

interface Corpse { x: number; y: number; kind: ZombieKind; age: number }
interface Ring { x: number; y: number; r: number; max: number; life: number; color: string }
interface Label { x: number; y: number; text: string; life: number; big?: boolean; sun?: boolean }
interface SunFlight { sx: number; sy: number; life: number }

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

/**
 * Draws the whole lawn onto a 1440 × 810 canvas, plus the cosmetic layers
 * (particles, rings, floating labels) that outlive the entities that spawned them.
 */
export class GardenRenderer {
  private readonly ctx: CanvasRenderingContext2D
  private background?: HTMLCanvasElement
  private zombieAtlas?: HTMLImageElement

  /** Individual sprites cut out of the atlas, indexed by `PlantDef.sprite`. */
  sprites: HTMLCanvasElement[] = []
  /** Data-URL versions of the same sprites, for `<img>` tags in the React UI. */
  thumbs: string[] = []

  private particles: Particle[] = []
  private corpses: Corpse[] = []
  private rings: Ring[] = []
  private labels: Label[] = []
  private sunFlights: SunFlight[] = []

  private time = 0
  private dt = 0
  private shake = 0
  reduced: boolean

  private readonly decor = Array.from({ length: 25 }, (_, i) => ({
    x: (i * 157 + 51) % 1440,
    y: 110 + ((i * 173) % 690),
    phase: i * 2.13,
    size: 1 + (i % 3),
  }))

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('这个浏览器不支持 Canvas 2D')
    this.ctx = ctx
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  get loaded() {
    return !!this.background
  }

  async load() {
    const [background, atlas, zombieAtlas] = await Promise.all([
      loadImage(gardenUrl), loadImage(spritesUrl), loadImage(zombieAnimationsUrl),
    ])
    this.background = this.prepareBackground(background)
    this.zombieAtlas = zombieAtlas
    for (const [sx, sy, sw, sh] of SPRITE_RECTS) {
      const cut = document.createElement('canvas')
      cut.width = sw
      cut.height = sh
      cut.getContext('2d')!.drawImage(atlas, sx, sy, sw, sh, 0, 0, sw, sh)
      this.sprites.push(cut)
      this.thumbs.push(cut.toDataURL('image/png'))
    }
  }

  /** Fit the painted bands to the same equal-height rows used for interaction. */
  private prepareBackground(image: HTMLImageElement) {
    const canvas = document.createElement('canvas')
    canvas.width = FIELD.w
    canvas.height = FIELD.h
    const c = canvas.getContext('2d')!
    // Measured stripe boundaries in garden.png, expressed in canvas units.
    // Resample once on load; the illustration does not define gameplay geometry.
    const sourceEdges = [140, 245, 350, 463, 583, 760]
    const sourceScale = image.naturalHeight / FIELD.h
    const strip = (top: number, bottom: number, y: number, height: number) => {
      c.drawImage(image, 0, top * sourceScale, image.naturalWidth, (bottom - top) * sourceScale,
        0, y, FIELD.w, height)
    }
    strip(0, sourceEdges[0], 0, FIELD.y)
    for (let row = 0; row < FIELD.rows; row++) {
      const { y, height } = cellBounds(row, 0)
      strip(sourceEdges[row], sourceEdges[row + 1], y, height)
    }
    const bottom = FIELD.y + FIELD.rows * FIELD.ch
    strip(sourceEdges[FIELD.rows], FIELD.h, bottom, FIELD.h - bottom)
    return canvas
  }

  /** Drops every transient effect — called when a new run starts. */
  reset() {
    this.particles = []
    this.corpses = []
    this.rings = []
    this.labels = []
    this.sunFlights = []
    this.shake = 0
  }

  // ---------------------------------------------------------------- effects

  private particle(x: number, y: number, color: string, n = 8, speed = 65, size = 4) {
    if (this.reduced) n = Math.ceil(n / 3)
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      const v = (0.3 + Math.random()) * speed
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 25,
        life: 0.3 + Math.random() * 0.65,
        max: 1,
        color,
        size: size * (0.4 + Math.random() * 0.6),
        rotate: Math.random() * 6,
      })
    }
  }

  event(e: GameEvent) {
    switch (e.type) {
      case 'plant':
      case 'shovel':
        this.particle(e.x, e.y - 6, '#715332', 13, 85, 6)
        this.particle(e.x, e.y - 18, '#b3cd50', 9, 70, 5)
        this.rings.push({ x: e.x, y: e.y - 5, r: 12, max: 58, life: 0.42, color: '#f3eb99' })
        break
      case 'hit':
        this.particle(e.x, e.y, e.ice ? '#d3f9ff' : '#d4eb75', 4, 65, 4)
        break
      case 'kill':
        this.corpses.push({ x: e.x, y: e.y, kind: e.entityType, age: 0 })
        this.particle(e.x, e.y - 55, '#9fa978', 7, 80, 5)
        this.labels.push({ x: e.x, y: e.y - 105, text: `+${ZOMBIES[e.entityType].score}`, life: 0.8 })
        break
      case 'shoot':
        this.particle(e.x, e.y, e.ice ? '#c3faff' : '#d2ea77', 2, 26, 3)
        break
      case 'explode':
        this.shake = e.big ? 12 : 6
        this.particle(e.x, e.y, '#ffc957', e.big ? 60 : 28, 260, 12)
        this.particle(e.x, e.y, '#e97438', 25, 180, 14)
        this.particle(e.x, e.y, '#fcf2b0', 20, 330, 7)
        this.rings.push({ x: e.x, y: e.y, r: 12, max: e.big ? 205 : 98, life: 0.6, color: '#ffe781' })
        this.labels.push({ x: e.x, y: e.y - 50, text: e.big ? 'BOOM!' : '土豆雷！', life: 1.3, big: true })
        break
      case 'collect':
        this.sunFlights.push({ sx: e.x, sy: e.y, life: 0 })
        this.labels.push({ x: e.x, y: e.y - 32, text: '+25', life: 0.9, sun: true })
        break
      case 'chomp':
        this.particle(e.x, e.y, '#c79bdf', 17, 110, 7)
        this.labels.push({ x: e.x, y: e.y - 60, text: '啊呜！', life: 0.8 })
        break
      case 'bite':
        this.particle(e.x + 16, e.y, '#b3cd50', 4, 35, 3)
        break
      case 'win':
        for (let i = 0; i < 80; i++) {
          this.particles.push({
            x: Math.random() * 1440,
            y: -Math.random() * 800,
            vx: (Math.random() - 0.5) * 70,
            vy: 100 + Math.random() * 80,
            life: 7,
            max: 7,
            color: ['#f6d56a', '#a4cc64', '#f39376', '#fff2c3'][i % 4],
            size: 5 + Math.random() * 4,
            confetti: true,
            rotate: Math.random() * 6,
          })
        }
        break
      default:
        break
    }
  }

  // ---------------------------------------------------------------- primitives

  private drawSprite(
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    angle = 0,
    opacity = 1,
    flash = 0,
  ) {
    const image = this.sprites[index]
    if (!image) return
    const c = this.ctx
    c.save()
    c.translate(x, y)
    c.rotate(angle)
    c.globalAlpha = opacity
    if (flash > 0) c.filter = 'brightness(1.8)'
    c.drawImage(image, -width / 2, -height, width, height)
    c.restore()
  }

  private shadow(x: number, y: number, w = 38, h = 10, alpha = 0.21) {
    const c = this.ctx
    c.fillStyle = `rgba(24,42,14,${alpha})`
    c.beginPath()
    c.ellipse(x, y, w, h, 0, 0, Math.PI * 2)
    c.fill()
  }

  private health(x: number, y: number, value: number, color: string) {
    const c = this.ctx
    c.fillStyle = '#26341ca1'
    c.beginPath()
    c.roundRect(x - 23, y, 46, 5, 2.5)
    c.fill()
    c.fillStyle = color
    c.beginPath()
    c.roundRect(x - 22, y + 1, Math.max(0, 44 * value), 3, 1.5)
    c.fill()
  }

  private sun(x: number, y: number, r = 27, alpha = 1) {
    const c = this.ctx
    c.save()
    c.translate(x, y)
    c.globalAlpha = alpha
    c.rotate(this.time * 0.16)

    const glow = c.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.3)
    glow.addColorStop(0, '#fffaa15c')
    glow.addColorStop(0.45, '#ffd74730')
    glow.addColorStop(1, '#ffe37300')
    c.fillStyle = glow
    c.fillRect(-r * 2.3, -r * 2.3, r * 4.6, r * 4.6)

    c.beginPath()
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12
      const rr = i % 2 ? r * 0.87 : r * 1.3
      const px = Math.cos(a) * rr
      const py = Math.sin(a) * rr
      if (i) c.lineTo(px, py)
      else c.moveTo(px, py)
    }
    c.closePath()
    c.fillStyle = '#fbd455'
    c.strokeStyle = '#e7aa35'
    c.lineWidth = 1.5
    c.fill()
    c.stroke()

    const face = c.createRadialGradient(-r * 0.23, -r * 0.3, 0, 0, 0, r)
    face.addColorStop(0, '#fffcd3')
    face.addColorStop(0.5, '#ffeb82')
    face.addColorStop(1, '#f9bd3d')
    c.fillStyle = face
    c.beginPath()
    c.arc(0, 0, r * 0.79, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = '#fff4ae'
    c.lineWidth = 2
    c.stroke()
    c.restore()
  }

  // ---------------------------------------------------------------- entities

  private plant(p: RenderPlant, demo = false) {
    const c = this.ctx
    const t = this.time
    const def = PLANTS[p.type]
    const age = p.age ?? 5

    let w = 88
    let h = 94
    if (p.type === P_WALLNUT) { w = 70; h = 91 }
    if (p.type === 3) { w = 97; h = 95 }
    if (p.type === P_CHERRY) { w = 97; h = 101 }
    if (p.type === P_CHOMPER) { w = 99; h = 106 }
    if (p.type === P_MINE) { w = 81; h = 62 }

    const phase = (p.id || p.x) * 0.7
    const sway = this.reduced ? 0 : Math.sin(t * 2.4 + phase) * 0.035
    const grow = Math.min(1, age * 5)
    const bounce = grow < 1 ? 1 + Math.sin(grow * Math.PI) * 0.2 : 1
    const action = p.action ?? 0

    let sy = 1 + Math.sin(t * 2.8 + phase) * 0.02
    let sx = 1
    if (action > 0) {
      sx = 1 + Math.sin(action * 16) * 0.08
      sy = 1 - Math.sin(action * 16) * 0.06
    }

    const arming = p.type === P_MINE && !demo && age < 8
    let opacity = 1
    if (arming) { h = 38; w = 67; opacity = 0.78 }

    const chew = p.chew ?? 0
    if (p.type === P_CHOMPER && chew > 0) {
      sx = 1 + Math.sin(t * 8) * 0.055
      sy = 0.9 + Math.cos(t * 8) * 0.025
    }

    this.shadow(p.x, p.y - 1, w * 0.39, 9, 0.2 * grow)

    if (p.type === P_SUNFLOWER) {
      const glow = c.createRadialGradient(p.x, p.y - 50, 5, p.x, p.y - 50, 65)
      glow.addColorStop(0, '#ffe56a16')
      glow.addColorStop(1, '#ffe56a00')
      c.fillStyle = glow
      c.fillRect(p.x - 70, p.y - 120, 140, 140)
    }

    this.drawSprite(def.sprite, p.x, p.y, w * sx * grow * bounce, h * sy * grow, sway, opacity, p.flash ?? 0)

    if (arming) {
      c.fillStyle = '#24361299'
      c.beginPath()
      c.ellipse(p.x, p.y - 4, 23, 5, 0, 0, 6.28)
      c.fill()
      this.health(p.x, p.y + 8, age / 8, '#efcf70')
    }
    if (p.type === P_MINE && age >= 8 && Math.sin(t * 6) > 0) {
      c.fillStyle = '#ff624d'
      c.shadowColor = '#ff8b56'
      c.shadowBlur = 12
      c.beginPath()
      c.arc(p.x + 2, p.y - 50, 4, 0, Math.PI * 2)
      c.fill()
      c.shadowBlur = 0
    }
    if (p.type === P_CHOMPER && chew > 0) this.health(p.x, p.y + 8, 1 - chew / 22, '#d9a9f4')

    const ratio = p.hp / p.maxHp
    if (p.hp < p.maxHp) this.health(p.x, p.y - h - 12, ratio, ratio < 0.3 ? '#ef8b61' : '#cce078')
    if (p.type === P_WALLNUT && ratio < 0.55) {
      c.strokeStyle = '#684824'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(p.x + 16, p.y - 61)
      c.lineTo(p.x + 5, p.y - 48)
      c.lineTo(p.x + 14, p.y - 35)
      c.lineTo(p.x, p.y - 21)
      c.stroke()
    }
  }

  private drawZombieSprite(kind: ZombieKind, frame: number, x: number, y: number, flash = 0) {
    if (!this.zombieAtlas) return
    const [sx, sy, sw, sh, anchorX] = ZOMBIE_FRAMES[kind][frame]
    const scale = kind === 'football' ? 0.54 : 0.56
    // Include the fine hair/outline outside the solid body bounds.
    const left = sx - 2
    const top = kind === 'football' ? Math.max(799, sy - 7) : sy - 7
    const width = sw + 4
    const height = sy + sh + 2 - top
    const c = this.ctx
    c.save()
    if (flash > 0) c.filter = 'brightness(1.8)'
    c.drawImage(
      this.zombieAtlas, left, top, width, height,
      x + (left - anchorX) * scale, y + (top - sy - sh) * scale,
      width * scale, height * scale,
    )
    c.restore()
  }

  private zombie(z: RenderZombie, demo = false) {
    const c = this.ctx
    const t = this.time
    const def = ZOMBIES[z.type]
    const slow = z.slow ?? 0

    let kind = z.type
    const w = z.type === 'football' ? 111 : 93
    let h = z.type === 'cone' ? 140 : 127
    // Once the cone or bucket is chewed through, the zombie shows its bare head.
    if (!demo && (z.type === 'cone' || z.type === 'bucket') && z.hp < 180) {
      kind = 'normal'
      h = 125
    }

    const frame = zombieFrame({
      id: z.id ?? 0,
      type: z.type,
      walkDistance: z.walkDistance ?? t * def.speed,
      eating: z.eating ?? false,
      eatPhase: z.eatPhase ?? 0,
    })

    this.shadow(z.x, z.y + 1, w * 0.37, 9, 0.25)

    if (slow > 0) {
      c.save()
      c.globalAlpha = 0.25
      c.fillStyle = '#91e7fc'
      c.beginPath()
      c.ellipse(z.x, z.y - 4, 45, 12, 0, 0, 6.28)
      c.fill()
      c.restore()

      c.save()
      c.shadowColor = '#a1eaff'
      c.shadowBlur = 13
      this.drawZombieSprite(kind, frame, z.x, z.y, z.flash ?? 0)
      c.restore()

      c.save()
      c.strokeStyle = '#d2f7ff'
      c.lineWidth = 1.5
      for (let i = 0; i < 3; i++) {
        const xx = z.x - 25 + i * 22
        const yy = z.y - 60 + Math.sin(t * 3 + i) * 13
        c.beginPath()
        c.moveTo(xx - 4, yy)
        c.lineTo(xx + 4, yy)
        c.moveTo(xx, yy - 4)
        c.lineTo(xx, yy + 4)
        c.stroke()
      }
      c.restore()
    } else {
      this.drawZombieSprite(kind, frame, z.x, z.y, z.flash ?? 0)
    }

    if (z.hp < z.maxHp) {
      this.health(z.x, z.y - h - 12, z.hp / z.maxHp, slow > 0 ? '#a1e7f2' : '#e1a65d')
    }
  }

  private mower(m: Mower) {
    if (m.state === 'spent') return
    const c = this.ctx
    const x = m.x
    const y = center(m.row, 0).y - 2
    const moving = m.state === 'moving'

    this.shadow(x, y + 5, 28, 7, 0.27)
    c.save()
    c.translate(x, y)
    if (moving) c.translate(0, Math.sin(this.time * 55) * 2)

    c.strokeStyle = '#344036'
    c.lineWidth = 4
    c.beginPath()
    c.moveTo(-12, -11)
    c.lineTo(-25, -49)
    c.lineTo(-41, -49)
    c.stroke()

    for (const dx of [-20, 18]) {
      c.fillStyle = '#24302b'
      c.beginPath()
      c.arc(dx, 0, 10, 0, 6.28)
      c.fill()
      c.fillStyle = '#909887'
      c.beginPath()
      c.arc(dx, 0, 4, 0, 6.28)
      c.fill()
    }

    c.fillStyle = '#8e3527'
    c.strokeStyle = '#572e21'
    c.lineWidth = 2
    c.beginPath()
    c.roundRect(-29, -25, 60, 21, 7)
    c.fill()
    c.stroke()

    c.fillStyle = '#c65338'
    c.beginPath()
    c.roundRect(-23, -26, 48, 12, 6)
    c.fill()
    c.fillStyle = '#464c3a'
    c.beginPath()
    c.roundRect(-10, -38, 27, 19, 4)
    c.fill()

    c.strokeStyle = '#7c8370'
    c.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      c.beginPath()
      c.moveTo(-5, -34 + i * 4)
      c.lineTo(12, -34 + i * 4)
      c.stroke()
    }

    c.fillStyle = '#e3c877'
    c.fillRect(25, -20, 8, 8)
    c.restore()

    if (moving && this.dt > 0 && Math.random() < 0.5) this.particle(x - 25, y - 10, '#e6deac', 2, 65, 7)
  }

  // ---------------------------------------------------------------- frame

  render(game: LawnGame | null, ui: RenderUi, dt: number) {
    if (!this.background) return
    this.dt = dt
    this.time += dt

    const c = this.ctx
    const t = this.time
    c.save()

    if (this.shake > 0) {
      c.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake)
      this.shake *= 0.84
      if (this.shake < 0.2) this.shake = 0
    }

    c.drawImage(this.background, 0, 0, 1440, 810)

    if (game && game.config.theme !== 'day') {
      c.fillStyle = game.config.theme === 'dusk' ? '#34355425' : '#f2a33b18'
      c.fillRect(0, 0, 1440, 810)
    }

    if (game) this.drawField(game, ui)
    else this.demo()

    this.drawDecor(t)
    this.drawCorpses(dt)
    this.drawParticles(dt)
    this.drawRings(dt)
    this.drawSunFlights(dt)
    this.drawLabels(dt)

    c.restore()
  }

  private drawField(game: LawnGame, ui: RenderUi) {
    const c = this.ctx
    const t = this.time

    c.save()
    c.strokeStyle = '#e6edac19'
    c.lineWidth = 1
    for (let col = 0; col <= FIELD.cols; col++) {
      c.beginPath()
      c.moveTo(FIELD.x + col * FIELD.cw, FIELD.y)
      c.lineTo(FIELD.x + col * FIELD.cw, FIELD.y + FIELD.rows * FIELD.ch)
      c.stroke()
    }
    for (let row = 0; row <= FIELD.rows; row++) {
      const y = FIELD.y + row * FIELD.ch
      c.beginPath()
      c.moveTo(FIELD.x, y)
      c.lineTo(FIELD.x + FIELD.cols * FIELD.cw, y)
      c.stroke()
    }
    c.restore()

    if (ui.hover && ui.selected !== null && game.state === 'playing') {
      this.drawHover(game, ui.hover, ui.selected)
    }

    for (let row = 0; row < FIELD.rows; row++) {
      this.mower(game.mowers[row])
      const lane = [
        ...game.plants.filter((p) => p.row === row).map((p) => ({ plant: p, x: p.x })),
        ...game.zombies.filter((z) => z.row === row).map((z) => ({ zombie: z, x: z.x })),
      ].sort((a, b) => a.x - b.x)
      for (const entry of lane) {
        if ('plant' in entry) this.plant(entry.plant)
        else this.zombie(entry.zombie)
      }
    }

    for (const s of game.shots) {
      c.save()
      c.shadowColor = s.ice ? '#bef9ff' : '#ceff83'
      c.shadowBlur = s.ice ? 12 : 5
      const g = c.createRadialGradient(s.x - 2, s.y - 3, 1, s.x, s.y, 10)
      g.addColorStop(0, s.ice ? '#f0ffff' : '#eeffb8')
      g.addColorStop(0.4, s.ice ? '#b5eafb' : '#add85b')
      g.addColorStop(1, s.ice ? '#69b6d5' : '#659526')
      c.fillStyle = g
      c.beginPath()
      c.arc(s.x, s.y, 9, 0, 6.28)
      c.fill()
      c.restore()
      c.strokeStyle = s.ice ? '#bceefa40' : '#dcf2a230'
      c.lineWidth = 5
      c.beginPath()
      c.moveTo(s.x - 10, s.y)
      c.lineTo(s.x - 24, s.y)
      c.stroke()
    }

    for (const s of game.suns) {
      const wobble = Math.sin(t * 2 + s.phase) * 3
      this.sun(s.x, s.y + wobble, 27, s.life < 3 ? 0.45 + Math.sin(t * 10) * 0.3 : 1)
    }
  }

  private drawHover(game: LawnGame, hover: { row: number; col: number }, selected: PlantType | 'shovel') {
    const c = this.ctx
    const { row, col } = hover
    const { x, y, width, height } = cellBounds(row, col)
    const occupied = game.plants.some((p) => p.row === row && p.col === col)
    const valid =
      selected === 'shovel'
        ? occupied
        : !occupied && game.sun >= PLANTS[selected].cost && game.cooldowns[selected] <= 0

    c.fillStyle = valid ? '#f6fac339' : '#f6936935'
    c.fillRect(x + 2, y + 2, width - 4, height - 4)
    c.strokeStyle = valid ? '#faffb9bb' : '#ffd19ba8'
    c.lineWidth = 2
    c.strokeRect(x + 3, y + 3, width - 6, height - 6)

    if (valid && selected !== 'shovel') {
      c.save()
      c.globalAlpha = 0.4
      this.plant({ type: selected, ...center(row, col), age: 5, id: 0, hp: 1, maxHp: 1 })
      c.restore()
    }
  }

  private drawDecor(t: number) {
    const c = this.ctx
    for (const d of this.decor) {
      const x = d.x + Math.sin(t * 0.2 + d.phase) * 25
      const y = d.y + Math.cos(t * 0.3 + d.phase) * 18
      c.fillStyle = `rgba(255,249,189,${0.15 + Math.sin(t * 0.7 + d.phase) * 0.12})`
      c.beginPath()
      c.arc(x, y, d.size, 0, 6.28)
      c.fill()
    }
  }

  private drawCorpses(dt: number) {
    const c = this.ctx
    for (const dead of this.corpses) {
      dead.age += dt
      c.save()
      c.translate(dead.x, dead.y)
      c.rotate(-Math.min(1.45, dead.age * 2.6))
      c.globalAlpha = Math.max(0, 1 - dead.age)
      this.drawZombieSprite(dead.kind, 0, 0, 0)
      c.restore()
    }
    this.corpses = this.corpses.filter((d) => d.age < 1)
  }

  private drawParticles(dt: number) {
    const c = this.ctx
    for (const p of this.particles) {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (!p.confetti) p.vy += 170 * dt
      p.rotate += dt * 3
      c.save()
      c.globalAlpha = Math.min(1, p.life * 2)
      c.translate(p.x, p.y)
      c.rotate(p.rotate)
      c.fillStyle = p.color
      if (p.confetti) {
        c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        c.beginPath()
        c.ellipse(0, 0, p.size, p.size * 0.65, 0, 0, 6.28)
        c.fill()
      }
      c.restore()
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  private drawRings(dt: number) {
    const c = this.ctx
    for (const r of this.rings) {
      r.life -= dt
      r.r += (r.max - r.r) * dt * 8
      c.save()
      c.globalAlpha = Math.max(0, r.life)
      c.strokeStyle = r.color
      c.lineWidth = r.life * 12
      c.beginPath()
      c.ellipse(r.x, r.y, r.r, r.r * 0.62, 0, 0, 6.28)
      c.stroke()
      c.restore()
    }
    this.rings = this.rings.filter((r) => r.life > 0)
  }

  /** Collected sun arcs toward the sun meter in the top-left of the board. */
  private drawSunFlights(dt: number) {
    for (const f of this.sunFlights) {
      f.life += dt * 1.8
      const a = Math.min(1, f.life)
      const ease = a * a
      const x = f.sx + (85 - f.sx) * ease
      const y = f.sy + (-90 - f.sy) * ease - 100 * Math.sin(a * Math.PI)
      this.sun(x, y, 22 * (1 - a * 0.6), 1 - a * 0.3)
    }
    this.sunFlights = this.sunFlights.filter((f) => f.life < 1)
  }

  private drawLabels(dt: number) {
    const c = this.ctx
    for (const l of this.labels) {
      l.life -= dt
      l.y -= dt * (l.big ? 8 : 25)
      c.save()
      c.globalAlpha = Math.min(1, l.life * 2)
      c.textAlign = 'center'
      c.font = `900 ${l.big ? 43 : l.sun ? 25 : 18}px system-ui`
      c.strokeStyle = l.big ? '#773b1d' : '#43501b'
      c.lineWidth = l.big ? 5 : 3
      c.strokeText(l.text, l.x, l.y)
      c.fillStyle = l.big ? '#fff1a5' : l.sun ? '#ffe789' : '#eef4b9'
      c.fillText(l.text, l.x, l.y)
      c.restore()
    }
    this.labels = this.labels.filter((l) => l.life > 0)
  }

  /** Idle lawn shown behind the main menu. */
  private demo() {
    const layout: [number, number, number][] = [
      [0, 4, 0], [0, 5, 1], [1, 3, 0], [1, 5, 1], [1, 6, 2], [2, 3, 0], [2, 4, 1],
      [2, 6, 3], [3, 2, 0], [3, 4, 5], [3, 6, 2], [4, 3, 0], [4, 5, 1], [4, 6, 6],
    ]
    const kinds: ZombieKind[] = ['normal', 'normal', 'cone', 'bucket', 'normal']

    for (let row = 0; row < FIELD.rows; row++) {
      this.mower({ row, x: FIELD.x - 47, state: 'ready' })
      for (const [r, col, type] of layout.filter((a) => a[0] === row)) {
        this.plant({ type, ...center(r, col), id: r * 9 + col, age: 5, hp: 100, maxHp: 100 }, true)
      }
      if (row > 0) {
        this.zombie(
          {
            type: kinds[row],
            row,
            x: row === 2 ? 1320 : 1360 - row * 16,
            y: center(row, 0).y,
            id: row,
            hp: 100,
            maxHp: 100,
            age: this.time,
            slow: 0,
          },
          true,
        )
      }
    }

    this.sun(780, 300 + Math.sin(this.time) * 8, 29)
    this.sun(1010, 555 + Math.sin(this.time + 2) * 6, 24)

    const c = this.ctx
    for (let row = 1; row < FIELD.rows; row++) {
      const x = 920 + ((this.time * 115 + row * 151) % 340)
      c.fillStyle = row === 2 ? '#b9eff2' : '#c6e98b'
      c.beginPath()
      c.arc(x, center(row, 0).y - 57, 8, 0, 6.28)
      c.fill()
    }
  }
}
