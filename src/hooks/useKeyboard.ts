import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { GameController } from '../controller/GameController'
import { useAppStore } from '../store/appStore'
import { useGameStore } from '../store/gameStore'

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

/**
 * Global game shortcuts. Dialogs handle their own Tab trapping and Escape,
 * so this bails out entirely whenever a modal is open.
 */
export function useKeyboard(
  controller: GameController | null,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    if (!controller) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (useAppStore.getState().modal) return

      const { running, paused, status } = useGameStore.getState()
      const onCanvas = document.activeElement === canvasRef.current

      if (!running) {
        if (event.key === 'Enter' && onCanvas) {
          const { selectedLevel, mode } = useAppStore.getState()
          controller.start(selectedLevel, mode === 'endless')
        }
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        if (!paused && controller.clearSelection()) return
        controller.togglePause()
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        if (!event.repeat) controller.togglePause()
        return
      }
      if (paused || status !== 'playing') return

      if (/^[1-8]$/.test(event.key)) {
        event.preventDefault()
        controller.selectPlant(Number(event.key) - 1)
        return
      }
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        controller.selectShovel()
        return
      }
      if (key === 'c') {
        event.preventDefault()
        controller.collectAll()
        return
      }

      const arrow = ARROWS[event.key]
      if (arrow) {
        event.preventDefault()
        controller.moveKeyboardCell(arrow[0], arrow[1])
        return
      }
      if (event.key === 'Enter' && onCanvas) {
        event.preventDefault()
        controller.interactAtKeyboardCell(event.shiftKey)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controller, canvasRef])
}
