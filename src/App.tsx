import { useEffect } from 'react'
import { ControllerContext } from './controller/context'
import { useGarden } from './hooks/useGarden'
import { useKeyboard } from './hooks/useKeyboard'
import { useAppStore } from './store/appStore'
import { useGameStore } from './store/gameStore'
import { GameFooter } from './ui/GameFooter'
import { GameModals } from './ui/GameModals'
import { GardenBoard } from './ui/GardenBoard'
import { Icon } from './ui/Icon'
import { Masthead } from './ui/Masthead'
import { PauseOverlay } from './ui/PauseOverlay'
import { ResultOverlay } from './ui/ResultOverlay'
import { SeedBank } from './ui/SeedBank'

function BottomNote() {
  return (
    <div className="bottom-note">
      <span>
        <Icon name="leaf" /> 好好种植，天天向上。
      </span>
      <span className="keyboard-hint">
        <kbd>1—8</kbd> 选植物 <b>·</b> <kbd>空格</kbd> 暂停 <b>·</b> <kbd>S</kbd> 铲子 <b>·</b>{' '}
        <kbd>Esc</kbd> 取消
      </span>
      <span>一份献给童年的小小致敬</span>
    </div>
  )
}

export default function App() {
  const { canvasRef, controller, thumbs, status } = useGarden()
  const running = useGameStore((s) => s.running)
  const paused = useGameStore((s) => s.paused)
  const result = useAppStore((s) => s.result)
  const modal = useAppStore((s) => s.modal)
  const live = useAppStore((s) => s.live)

  useKeyboard(controller, canvasRef)

  // The stylesheet switches to its compact in-game layout off this class.
  useEffect(() => {
    document.body.classList.toggle('playing', running)
    return () => document.body.classList.remove('playing')
  }, [running])

  // A modal halts the run without showing the pause card.
  useEffect(() => {
    if (modal) controller?.suspend()
    else controller?.unsuspend()
  }, [modal, controller])

  return (
    <ControllerContext value={controller}>
      <main className="game-shell">
        <Masthead />
        <section className="play-container" aria-label="植物大战僵尸游戏">
          <SeedBank thumbs={thumbs} />
          <GardenBoard canvasRef={canvasRef} status={status} />
          <GameFooter />
        </section>
        <BottomNote />
      </main>

      {/* Viewport dialogs must escape the garden's clipping and stacking context. */}
      {paused && <PauseOverlay thumbs={thumbs} />}
      {result && <ResultOverlay result={result} thumbs={thumbs} />}
      <GameModals thumbs={thumbs} />
      <div className="sr-only" aria-live="polite">
        {live}
      </div>
    </ControllerContext>
  )
}
