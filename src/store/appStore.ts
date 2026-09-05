import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EndSummary } from '../game/types'

export interface Settings {
  sound: boolean
  music: boolean
  auto: boolean
  reduced: boolean
}

export interface LevelRecord {
  stars: number
  score: number
}

export type ModalName = 'almanac' | 'help' | 'settings'
export type Mode = 'adventure' | 'endless'

/** A transient message; the id makes repeated identical texts restart the animation. */
interface Flash {
  id: number
  text: string
  sub?: string
}

interface AppState {
  // Persisted -------------------------------------------------------------
  settings: Settings
  records: Record<number, LevelRecord>
  endlessBest: number

  // Session shell ---------------------------------------------------------
  mode: Mode
  selectedLevel: number
  modal: ModalName | null
  result: EndSummary | null
  toast: Flash | null
  banner: Flash | null
  /** Mirrored into an aria-live region for screen readers. */
  live: string

  // Actions ---------------------------------------------------------------
  toggleSetting(key: keyof Settings): void
  setMode(mode: Mode): void
  setSelectedLevel(level: number): void
  openModal(modal: ModalName): void
  closeModal(): void
  setResult(result: EndSummary | null): void
  showToast(text: string, duration?: number): void
  showBanner(text: string, sub: string, duration: number): void
  announce(text: string): void
  saveResult(summary: EndSummary): void
}

let flashId = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined
let bannerTimer: ReturnType<typeof setTimeout> | undefined

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: { sound: true, music: true, auto: false, reduced: false },
      records: {},
      endlessBest: 0,

      mode: 'adventure',
      selectedLevel: 0,
      modal: null,
      result: null,
      toast: null,
      banner: null,
      live: '',

      toggleSetting: (key) =>
        set((state) => ({ settings: { ...state.settings, [key]: !state.settings[key] } })),
      setMode: (mode) => set({ mode }),
      setSelectedLevel: (selectedLevel) => set({ selectedLevel }),
      openModal: (modal) => set({ modal }),
      closeModal: () => set({ modal: null }),
      setResult: (result) => set({ result }),

      showToast: (text, duration = 2600) => {
        clearTimeout(toastTimer)
        set({ toast: { id: ++flashId, text }, live: text })
        toastTimer = setTimeout(() => set({ toast: null }), duration)
      },
      showBanner: (text, sub, duration) => {
        clearTimeout(bannerTimer)
        set({ banner: { id: ++flashId, text, sub }, live: text })
        bannerTimer = setTimeout(() => set({ banner: null }), duration)
      },
      announce: (live) => set({ live }),

      saveResult: (summary) => {
        if (summary.won) {
          const previous = get().records[summary.level]
          set((state) => ({
            records: {
              ...state.records,
              [summary.level]: {
                stars: Math.max(summary.stars, previous?.stars ?? 0),
                score: Math.max(summary.score, previous?.score ?? 0),
              },
            },
          }))
        } else if (summary.endless) {
          set((state) => ({ endlessBest: Math.max(state.endlessBest, summary.wave) }))
        }
      },
    }),
    {
      name: 'pvz-react-v1',
      version: 1,
      partialize: (state) => ({
        settings: state.settings,
        records: state.records,
        endlessBest: state.endlessBest,
      }),
    },
  ),
)
