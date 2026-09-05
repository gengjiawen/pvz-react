import { create } from 'zustand'
import { LEVELS, PLANTS } from '../game/config'
import type { GameState, PlantType } from '../game/types'

export type Selection = PlantType | 'shovel' | null

/**
 * A throttled projection of the running simulation — the only game state React
 * ever reads. The canvas draws from the live entities instead, so this stays
 * small and only refreshes ~11 times a second.
 */
export interface GameHud {
  /** Sprites decoded and the loop running. */
  ready: boolean
  /** A run exists (as opposed to sitting on the home screen). */
  running: boolean
  status: GameState
  paused: boolean
  /** Halted by an open modal, without showing the pause card. */
  suspended: boolean
  speed: 1 | 2
  selected: Selection
  sun: number
  cooldowns: number[]
  level: number
  endless: boolean
  time: number
  kills: number
  wave: number
  waveTotal: number
  waveCountdown: number
  progress: number
}

export const IDLE_HUD: GameHud = {
  ready: false,
  running: false,
  status: 'playing',
  paused: false,
  suspended: false,
  speed: 1,
  selected: null,
  sun: LEVELS[0].initial,
  cooldowns: Array(PLANTS.length).fill(0),
  level: 0,
  endless: false,
  time: 0,
  kills: 0,
  wave: 0,
  waveTotal: LEVELS[0].waves,
  waveCountdown: 15,
  progress: 0,
}

/** Written only by `GameController`; components subscribe with selectors. */
export const useGameStore = create<GameHud>()(() => IDLE_HUD)
