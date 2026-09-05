import { useEffect, useRef, useState } from 'react'
import { GameController } from '../controller/GameController'
import { useAppStore } from '../store/appStore'

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Creates the controller once the canvas is mounted, decodes the sprite atlas,
 * and keeps the controller in sync with persisted settings.
 */
export function useGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [controller, setController] = useState<GameController | null>(null)
  const [thumbs, setThumbs] = useState<string[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const settings = useAppStore((s) => s.settings)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const instance = new GameController(canvas, useAppStore.getState().settings)
    let cancelled = false
    setController(instance)

    instance
      .load()
      .then(() => {
        if (cancelled) return
        setThumbs(instance.renderer.thumbs)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error(error)
        setStatus('error')
      })

    const onVisibility = () => instance.handleVisibilityChange(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      instance.dispose()
      setController(null)
    }
  }, [])

  useEffect(() => {
    controller?.setSettings(settings)
  }, [controller, settings])

  return { canvasRef, controller, thumbs, status }
}
