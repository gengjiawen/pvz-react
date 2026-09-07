/** Index into `PLANTS`. Doubles as the seed-card slot and the hotkey (1–8). */
export type PlantType = number
export type ZombieKind = 'normal' | 'cone' | 'bucket' | 'football'

export interface PlantDef {
  id: string
  name: string
  cost: number
  cool: number
  hp: number
  sprite: number
  role: string
  desc: string
  color: string
}

export interface ZombieDef {
  name: string
  hp: number
  speed: number
  sprite: number
  score: number
}

export interface LevelDef {
  name: string
  subtitle: string
  waves: number
  initial: number
  gap: number
  count: number
  more: number
  theme: 'day' | 'golden' | 'dusk'
}

export interface Plant {
  id: number
  type: PlantType
  row: number
  col: number
  x: number
  y: number
  hp: number
  maxHp: number
  age: number
  /** Counts down while the plant plays its "acting" squash-and-stretch. */
  action: number
  attack: number
  produce: number
  chew: number
  burst: number
  flash: number
}

export interface Zombie {
  id: number
  type: ZombieKind
  row: number
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  age: number
  /** Actual distance travelled; the walk cycle stops while eating. */
  walkDistance: number
  slow: number
  attack: number
  /** Duration of the current bite, retained if slow changes mid-cycle. */
  biteDuration: number
  /** Full-body chewing progress (0–1), independent of individual damage ticks. */
  eatPhase: number
  flash: number
  eating: boolean
}

export interface Shot {
  x: number
  y: number
  row: number
  prev: number
  speed: number
  damage: number
  ice: boolean
  dead?: boolean
}

export interface Sun {
  id: number
  x: number
  y: number
  targetY: number
  age: number
  life: number
  value: number
  fromSky: boolean
  phase: number
}

export interface Mower {
  row: number
  x: number
  state: 'ready' | 'moving' | 'spent'
}

export type GameState = 'playing' | 'won' | 'lost'

/**
 * Engine events, drained once per frame. The renderer turns them into
 * particles, the audio layer into sounds, and React into toasts/banners.
 */
export type GameEvent =
  | { type: 'plant'; x: number; y: number; entityType: PlantType }
  | { type: 'shovel'; x: number; y: number }
  | { type: 'hint'; text: string }
  | { type: 'collect'; x: number; y: number; value: number }
  | { type: 'hit'; x: number; y: number; ice: boolean }
  | { type: 'kill'; x: number; y: number; row: number; entityType: ZombieKind }
  | { type: 'shoot'; x: number; y: number; ice: boolean }
  | { type: 'explode'; x: number; y: number; big: boolean }
  | { type: 'chomp'; x: number; y: number }
  | { type: 'bite'; x: number; y: number }
  | { type: 'wave'; wave: number; final: boolean }
  | { type: 'mower'; row: number }
  | { type: 'end'; won: boolean }
  | { type: 'win' }

/** Everything the result card needs, captured at the moment a run ends. */
export interface EndSummary {
  won: boolean
  level: number
  endless: boolean
  wave: number
  score: number
  kills: number
  planted: number
  stars: number
}

export interface GameOptions {
  level?: number
  endless?: boolean
  autoCollect?: boolean
  rng?: () => number
}
