import {
  FIELD,
  LEVELS,
  PLANTS,
  P_CHERRY,
  P_CHOMPER,
  P_MINE,
  P_SNOW,
  P_SUNFLOWER,
  P_REPEATER,
  SHOOTERS,
  ZOMBIES,
  center,
} from './config'
import type {
  GameEvent,
  GameOptions,
  GameState,
  LevelDef,
  Mower,
  Plant,
  PlantType,
  Shot,
  Sun,
  Zombie,
  ZombieKind,
} from './types'

/**
 * Headless lawn simulation. Knows nothing about the DOM, canvas or React —
 * step it with `update(dt)` and drain `events` once per frame.
 */
export class LawnGame {
  readonly level: number
  readonly endless: boolean
  readonly config: LevelDef
  readonly waveTotal: number

  private readonly rng: () => number
  private nextId = 1

  sun: number
  time = 0
  score = 0
  state: GameState = 'playing'
  autoCollect: boolean

  plants: Plant[] = []
  zombies: Zombie[] = []
  shots: Shot[] = []
  suns: Sun[] = []
  mowers: Mower[]
  cooldowns: number[] = Array(PLANTS.length).fill(0)
  events: GameEvent[] = []

  private queue: { at: number; row: number; type: ZombieKind }[] = []
  private nextWave = 15
  private nextSun = 3

  wave = 0
  kills = 0
  spent = 0
  planted = 0
  collected = 0
  usedMowers = 0

  constructor(options: GameOptions = {}) {
    this.level = options.level ?? 0
    this.endless = !!options.endless
    this.rng = options.rng ?? Math.random
    this.config = LEVELS[Math.min(this.level, LEVELS.length - 1)]
    this.sun = this.config.initial
    this.autoCollect = !!options.autoCollect
    this.waveTotal = this.endless ? Infinity : this.config.waves
    this.mowers = Array.from({ length: FIELD.rows }, (_, row) => ({
      row,
      x: FIELD.x - 48,
      state: 'ready' as const,
    }))
  }

  private rand(min: number, max: number) {
    return min + (max - min) * this.rng()
  }

  private emit(event: GameEvent) {
    this.events.push(event)
  }

  // ---------------------------------------------------------------- player actions

  plant(type: PlantType, row: number, col: number): boolean {
    const def = PLANTS[type]
    if (this.state !== 'playing' || !def) return false
    if (row < 0 || row >= FIELD.rows || col < 0 || col >= FIELD.cols) return false
    if (this.plants.some((p) => p.row === row && p.col === col)) {
      this.emit({ type: 'hint', text: '这块草坪已经有植物啦' })
      return false
    }
    if (this.sun < def.cost) {
      this.emit({ type: 'hint', text: '阳光不足，收集更多阳光吧' })
      return false
    }
    if (this.cooldowns[type] > 0) {
      this.emit({ type: 'hint', text: '种子正在准备，请稍等' })
      return false
    }

    this.sun -= def.cost
    this.spent += def.cost
    this.planted++
    this.cooldowns[type] = def.cool

    const pos = center(row, col)
    this.plants.push({
      id: this.nextId++,
      type,
      row,
      col,
      ...pos,
      hp: def.hp,
      maxHp: def.hp,
      age: 0,
      action: 0,
      attack: 0.45,
      produce: 6,
      chew: 0,
      burst: 0,
      flash: 0,
    })
    this.emit({ type: 'plant', x: pos.x, y: pos.y, entityType: type })
    return true
  }

  shovel(row: number, col: number): boolean {
    if (this.state !== 'playing') return false
    const target = this.plants.find((p) => p.row === row && p.col === col)
    if (!target) return false
    this.plants = this.plants.filter((p) => p !== target)
    this.emit({ type: 'shovel', x: target.x, y: target.y })
    return true
  }

  collect(id: number): boolean {
    if (this.state !== 'playing') return false
    const sun = this.suns.find((s) => s.id === id)
    if (!sun) return false
    this.sun += sun.value
    this.collected += sun.value
    this.suns = this.suns.filter((s) => s !== sun)
    this.emit({ type: 'collect', x: sun.x, y: sun.y, value: sun.value })
    return true
  }

  /** Sun within grabbing distance of a canvas-space point, nearest first. */
  sunAt(x: number, y: number, radius = 42): Sun | undefined {
    return this.suns.find((s) => Math.hypot(s.x - x, s.y - y) < radius)
  }

  // ---------------------------------------------------------------- spawning

  private addSun(x: number, y: number, fromSky = false) {
    this.suns.push({
      id: this.nextId++,
      x,
      y: fromSky ? 100 : y - 60,
      targetY: y,
      age: 0,
      life: 14,
      value: 25,
      fromSky,
      phase: this.rand(0, 6),
    })
  }

  private spawn(type: ZombieKind, row: number, x = 1375) {
    const def = ZOMBIES[type]
    const scale = this.endless ? 1 + Math.max(0, this.wave - 4) * 0.055 : 1
    this.zombies.push({
      id: this.nextId++,
      type,
      row,
      x,
      y: center(row, 0).y,
      hp: def.hp * scale,
      maxHp: def.hp * scale,
      speed: def.speed * this.rand(0.91, 1.08),
      age: this.rand(0, 6),
      walkDistance: 0,
      slow: 0,
      attack: 0,
      biteDuration: 0.42,
      eatPhase: 0,
      flash: 0,
      eating: false,
    })
  }

  private launchWave() {
    this.wave++
    this.emit({ type: 'wave', wave: this.wave, final: this.wave === this.waveTotal })

    const count = this.endless
      ? Math.min(45, 5 + this.wave * 3)
      : this.config.count + (this.wave - 1) * this.config.more
    const tier = this.endless ? Math.min(2, Math.floor(this.wave / 3)) : this.level

    for (let i = 0; i < count; i++) {
      const roll = this.rng()
      let type: ZombieKind = 'normal'
      if (tier >= 2 && this.wave > 1 && roll > 0.86) type = 'football'
      else if (tier >= 1 && roll > 0.68) type = 'bucket'
      else if (roll > 0.53 && (this.wave > 1 || tier > 0)) type = 'cone'

      this.queue.push({
        at: this.time + i * Math.max(0.85, 3.2 - this.wave * 0.28),
        row: (i + Math.floor(this.rng() * FIELD.rows)) % FIELD.rows,
        type,
      })
    }
    this.queue.sort((a, b) => a.at - b.at)
    this.nextWave = this.time + (this.endless ? 35 : this.config.gap)
  }

  /** Seconds until the next wave, for the HUD countdown before wave 1. */
  get waveCountdown() {
    return Math.max(0, this.nextWave - this.time)
  }

  // ---------------------------------------------------------------- combat

  private damage(z: Zombie, amount: number, ice = false) {
    if (z.hp <= 0) return
    z.hp -= amount
    z.flash = 0.13
    if (ice) z.slow = 4
    this.emit({ type: 'hit', x: z.x - 12, y: z.y - 63, ice })
    if (z.hp <= 0) {
      this.kills++
      this.score += ZOMBIES[z.type].score
      this.emit({ type: 'kill', x: z.x, y: z.y, row: z.row, entityType: z.type })
    }
  }

  private explode(p: Plant, radius: number, damage: number) {
    this.emit({ type: 'explode', x: p.x, y: p.y - 40, big: p.type === P_CHERRY })
    for (const z of this.zombies) {
      const inRange =
        Math.abs(z.row - p.row) <= radius && Math.abs(z.x - p.x) < FIELD.cw * (radius + 0.75)
      if (inRange) this.damage(z, damage)
    }
    p.hp = 0
  }

  private shoot(p: Plant) {
    const ice = p.type === P_SNOW
    this.shots.push({
      x: p.x + 36,
      y: p.y - 57,
      row: p.row,
      prev: p.x + 36,
      speed: 355,
      damage: 20,
      ice,
    })
    p.action = 0.22
    this.emit({ type: 'shoot', x: p.x + 39, y: p.y - 57, ice })
  }

  // ---------------------------------------------------------------- simulation

  update(dt: number) {
    if (this.state !== 'playing') return
    dt = Math.min(dt, 0.05)
    this.time += dt
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt))

    if (this.time >= this.nextWave && this.wave < this.waveTotal) this.launchWave()
    while (this.queue.length && this.queue[0].at <= this.time) {
      const next = this.queue.shift()!
      this.spawn(next.type, next.row)
    }
    if (this.time >= this.nextSun) {
      this.addSun(this.rand(350, 1190), this.rand(230, 685), true)
      this.nextSun = this.time + 6
    }

    for (const s of [...this.suns]) {
      s.age += dt
      s.y += Math.min(s.targetY - s.y, (s.fromSky ? 76 : 100) * dt)
      s.life -= dt
      if (this.autoCollect && s.age > 1.1) this.collect(s.id)
    }
    this.suns = this.suns.filter((s) => s.life > 0)

    this.updatePlants(dt)
    this.updateShots(dt)
    this.updateZombies(dt)
    this.updateMowers(dt)

    this.zombies = this.zombies.filter((z) => z.hp > 0)
    this.plants = this.plants.filter((p) => p.hp > 0)

    const cleared =
      this.wave >= this.waveTotal && this.queue.length === 0 && this.zombies.length === 0
    if (!this.endless && cleared) {
      this.state = 'won'
      this.score += 500 + Math.floor(this.sun / 5) + (FIELD.rows - this.usedMowers) * 100
      this.emit({ type: 'end', won: true })
    }
  }

  private updatePlants(dt: number) {
    for (const p of this.plants) {
      if (p.hp <= 0) continue
      p.age += dt
      p.action = Math.max(0, p.action - dt)
      p.flash = Math.max(0, p.flash - dt)
      p.chew = Math.max(0, p.chew - dt)

      if (p.type === P_SUNFLOWER) {
        p.produce -= dt
        if (p.produce <= 0) {
          this.addSun(p.x + this.rand(-22, 22), p.y - 12)
          p.produce = 17
          p.action = 0.5
        }
      }

      if (p.type === P_CHERRY) {
        if (p.age >= 1.05) this.explode(p, 1, 1800)
        continue
      }

      const ahead = this.zombies.filter(
        (z) => z.hp > 0 && z.row === p.row && z.x > p.x - 25 && z.x < 1450,
      )

      if (p.type === P_MINE) {
        if (p.age >= 8 && ahead.some((z) => z.x - p.x < 50)) this.explode(p, 0, 1800)
        continue
      }

      if (p.type === P_CHOMPER) {
        const prey = ahead.filter((z) => z.x - p.x < 108).sort((a, b) => a.x - b.x)[0]
        if (prey && p.chew <= 0) {
          this.damage(prey, Infinity)
          p.chew = 22
          p.action = 0.6
          this.emit({ type: 'chomp', x: prey.x, y: prey.y - 50 })
        }
        continue
      }

      if (SHOOTERS.includes(p.type)) {
        p.attack -= dt
        if (p.burst > 0) {
          p.burst -= dt
          if (p.burst <= 0) this.shoot(p)
        }
        if (p.attack <= 0 && ahead.length) {
          this.shoot(p)
          p.attack = p.type === P_SNOW ? 1.7 : 1.4
          if (p.type === P_REPEATER) p.burst = 0.22
        }
      }
    }
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      s.prev = s.x
      s.x += s.speed * dt
      const hit = this.zombies
        .filter((z) => z.hp > 0 && z.row === s.row && z.x - 28 <= s.x && z.x + 25 >= s.prev)
        .sort((a, b) => a.x - b.x)[0]
      if (hit) {
        this.damage(hit, s.damage, s.ice)
        s.dead = true
      }
    }
    this.shots = this.shots.filter((s) => !s.dead && s.x < 1475)
  }

  private updateZombies(dt: number) {
    for (const z of this.zombies) {
      if (z.hp <= 0) continue
      z.age += dt
      z.slow = Math.max(0, z.slow - dt)
      z.flash = Math.max(0, z.flash - dt)
      z.attack -= dt

      const victim = this.plants
        .filter((p) => p.hp > 0 && p.row === z.row && z.x - p.x < 48 && z.x - p.x > -42)
        .sort((a, b) => b.x - a.x)[0]
      const wasEating = z.eating
      z.eating = !!victim

      if (victim) {
        // A full-body chew spans three damage ticks: 1.26 s at normal speed.
        z.eatPhase = wasEating ? (z.eatPhase + dt / (z.biteDuration * 3)) % 1 : 0
        if (z.attack <= 0) {
          victim.hp -= 28
          victim.flash = 0.15
          z.biteDuration = z.slow > 0 ? 0.65 : 0.42
          z.attack = z.biteDuration
          this.emit({ type: 'bite', x: victim.x, y: victim.y - 48 })
        }
      } else {
        z.eatPhase = 0
        const distance = z.speed * (z.slow > 0 ? 0.48 : 1) * dt
        z.x -= distance
        z.walkDistance += distance
      }

      const mower = this.mowers[z.row]
      if (z.x < FIELD.x - 16 && mower.state === 'ready') {
        mower.state = 'moving'
        this.usedMowers++
        this.emit({ type: 'mower', row: z.row })
      }
      if (z.x < 155 && mower.state === 'spent') {
        this.state = 'lost'
        this.emit({ type: 'end', won: false })
        return
      }
    }
  }

  private updateMowers(dt: number) {
    for (const m of this.mowers) {
      if (m.state !== 'moving') continue
      const prev = m.x
      m.x += 620 * dt
      for (const z of this.zombies) {
        if (z.row === m.row && z.hp > 0 && z.x < m.x + 55 && z.x > prev - 90) {
          this.damage(z, Infinity)
        }
      }
      if (m.x > 1500) m.state = 'spent'
    }
  }

  /** Stars awarded on a win: keeping every mower is a clean sweep. */
  get stars() {
    if (this.state !== 'won') return 0
    if (this.usedMowers === 0) return 3
    return this.usedMowers <= 2 ? 2 : 1
  }
}
