import type { Zombie, ZombieKind } from './types'

type AnimationState = Pick<Zombie, 'id' | 'type' | 'walkDistance' | 'eating' | 'eatPhase'>

// Start in contact, then recover, reach and open for the next slow chew.
const BITE_FRAMES = [6, 7, 4, 5] as const

export function zombieFrame(z: AnimationState): number {
  if (z.eating) {
    return BITE_FRAMES[Math.floor(z.eatPhase * BITE_FRAMES.length)]
  }

  const stride = z.type === 'football' ? 34 : 26
  return (Math.floor((z.walkDistance / stride) * 4) + z.id) % 4
}

/**
 * Measured rectangles in zombie-animations.png (1448 × 1086), with the ground
 * anchor in atlas coordinates. The generated atlas is NOT a uniform grid.
 * Keep one scale per kind: fitting each pose to a box would stretch the body
 * and make the feet slide when the zombie reaches forward to eat.
 */
type Frame = readonly [x: number, y: number, w: number, h: number, anchorX: number]
export const ZOMBIE_FRAMES: Record<ZombieKind, readonly Frame[]> = {
  normal: [
    [32, 49, 165, 218, 124], [218, 49, 148, 218, 291],
    [399, 49, 160, 217, 488], [570, 55, 130, 212, 646],
    [725, 54, 160, 213, 835], [910, 49, 160, 219, 1020],
    [1103, 71, 146, 196, 1200], [1288, 50, 129, 219, 1375],
  ],
  cone: [
    [32, 285, 169, 251, 124], [217, 281, 149, 256, 291],
    [396, 278, 157, 258, 488], [566, 283, 134, 254, 646],
    [734, 284, 158, 252, 835], [914, 285, 156, 252, 1020],
    [1105, 311, 143, 225, 1200], [1287, 284, 125, 253, 1375],
  ],
  bucket: [
    [28, 559, 167, 234, 124], [217, 552, 154, 238, 291],
    [398, 554, 158, 240, 488], [568, 558, 131, 237, 646],
    [728, 561, 159, 234, 835], [911, 554, 159, 241, 1020],
    [1097, 571, 153, 224, 1200], [1285, 558, 135, 237, 1375],
  ],
  football: [
    [22, 803, 180, 250, 124], [208, 802, 174, 251, 291],
    [388, 801, 177, 252, 488], [568, 806, 143, 246, 646],
    [730, 807, 165, 248, 835], [912, 803, 172, 252, 1020],
    [1101, 826, 160, 229, 1200], [1288, 812, 140, 242, 1375],
  ],
}
