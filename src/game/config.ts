import type { LevelDef, PlantDef, ZombieDef, ZombieKind } from './types'

export const PLANTS: PlantDef[] = [
  { id: 'sunflower', name: '向日葵', cost: 50, cool: 5, hp: 240, sprite: 0, role: '阳光生产', desc: '每隔 17 秒生产 25 阳光。先种两列，经济才会蒸蒸日上。', color: '#f5bd42' },
  { id: 'pea', name: '豌豆射手', cost: 100, cool: 5, hp: 260, sprite: 1, role: '远程攻击', desc: '向前方发射豌豆，是草坪上可靠的第一道火力。', color: '#9dcd4b' },
  { id: 'wallnut', name: '坚果墙', cost: 50, cool: 13, hp: 2400, sprite: 2, role: '坚实防线', desc: '用厚实的外壳阻挡僵尸，为身后的植物争取时间。', color: '#dba659' },
  { id: 'snow', name: '寒冰射手', cost: 175, cool: 8, hp: 260, sprite: 3, role: '冰冻减速', desc: '冰豌豆造成伤害，并让僵尸减速 4 秒。', color: '#82d6e5' },
  { id: 'cherry', name: '樱桃炸弹', cost: 150, cool: 28, hp: 300, sprite: 4, role: '范围爆破', desc: '种下 1 秒后爆炸，对周围 3 × 3 区域造成 1800 伤害。', color: '#f48672' },
  { id: 'repeater', name: '双发射手', cost: 200, cool: 8, hp: 280, sprite: 5, role: '双倍火力', desc: '连续发射两颗豌豆，适合对付路障与铁桶僵尸。', color: '#89b857' },
  { id: 'chomper', name: '大嘴花', cost: 150, cool: 13, hp: 340, sprite: 6, role: '近身吞噬', desc: '一口吞下前方一只僵尸，随后需要 22 秒消化。', color: '#c68dd3' },
  { id: 'mine', name: '土豆地雷', cost: 25, cool: 12, hp: 180, sprite: 7, role: '延时陷阱', desc: '需要 8 秒准备。就绪后触碰爆炸，适合提前布防。', color: '#d7b17e' },
]

/** Plant slot indices, so the update loop reads as rules rather than magic numbers. */
export const P_SUNFLOWER = 0
export const P_WALLNUT = 2
export const P_SNOW = 3
export const P_CHERRY = 4
export const P_REPEATER = 5
export const P_CHOMPER = 6
export const P_MINE = 7
export const SHOOTERS = [1, P_SNOW, P_REPEATER]

export const ZOMBIES: Record<ZombieKind, ZombieDef> = {
  normal: { name: '普通僵尸', hp: 180, speed: 15, sprite: 8, score: 10 },
  cone: { name: '路障僵尸', hp: 420, speed: 14, sprite: 9, score: 20 },
  bucket: { name: '铁桶僵尸', hp: 760, speed: 12.5, sprite: 10, score: 35 },
  football: { name: '橄榄球僵尸', hp: 1050, speed: 26, sprite: 11, score: 60 },
}

export const LEVELS: LevelDef[] = [
  { name: '阳光小院', subtitle: '每一场胜利，都从一颗种子开始。', waves: 3, initial: 200, gap: 32, count: 4, more: 3, theme: 'day' },
  { name: '铁桶来客', subtitle: '厚重的铁桶，需要更强的火力。', waves: 4, initial: 250, gap: 37, count: 5, more: 3, theme: 'golden' },
  { name: '最后的防线', subtitle: '他们来势汹汹，而你早有准备。', waves: 5, initial: 325, gap: 40, count: 6, more: 3, theme: 'dusk' },
]

/** Lawn geometry in 1440 × 810 canvas units. */
export const FIELD = {
  x: 238, cw: 115, cols: 9, rows: 5, w: 1440, h: 810,
  // Measured edges of the lower five grass bands in garden.png. The grass
  // beside the hedge is scenery; the painted lanes are not equally tall.
  rowEdges: [235, 337, 446, 557, 667, 758],
} as const

export const cellBounds = (row: number, col: number) => ({
  x: FIELD.x + col * FIELD.cw,
  y: FIELD.rowEdges[row],
  width: FIELD.cw,
  height: FIELD.rowEdges[row + 1] - FIELD.rowEdges[row],
})

/** Ground anchor shared by plants, zombies, mowers and planting previews. */
export const center = (row: number, col: number) => {
  const cell = cellBounds(row, col)
  return { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 }
}

export function cellAt(p: { x: number; y: number }) {
  const col = Math.floor((p.x - FIELD.x) / FIELD.cw)
  const row = FIELD.rowEdges.findIndex(
    (top, i) => i < FIELD.rows && p.y >= top && p.y < FIELD.rowEdges[i + 1],
  )
  return col >= 0 && col < FIELD.cols && row >= 0 ? { row, col } : null
}

/** Source rectangles of the 12 sprites packed into `sprites.png`. */
export const SPRITE_RECTS: [number, number, number, number][] = [
  [44, 6, 275, 310], [424, 28, 315, 292], [824, 5, 271, 311], [1181, 1, 326, 320],
  [30, 314, 313, 318], [420, 328, 321, 283], [799, 312, 336, 316], [1196, 403, 314, 238],
  [23, 637, 326, 371], [424, 607, 324, 402], [810, 633, 305, 375], [1184, 634, 336, 376],
]
