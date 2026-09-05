import { useController } from '../controller/context'
import { LEVELS, PLANTS } from '../game/config'
import { useAppStore } from '../store/appStore'
import { useGameStore } from '../store/gameStore'
import type { Selection } from '../store/gameStore'
import { Icon } from './Icon'

const FLAGS = [1, 2, 3].map((n) => `${(n / 3) * 100}%`)

function selectionHint(running: boolean, selected: Selection) {
  if (!running) return '准备好，种下第一颗种子。'
  if (selected === 'shovel') return '点击植物，即可将它铲除。'
  if (selected !== null) return `已选择 ${PLANTS[selected].name} · 点击空地种植`
  return '先选植物，再点击草坪种植。'
}

export function GameFooter() {
  const controller = useController()
  const endlessBest = useAppStore((s) => s.endlessBest)

  const running = useGameStore((s) => s.running)
  const status = useGameStore((s) => s.status)
  const paused = useGameStore((s) => s.paused)
  const speed = useGameStore((s) => s.speed)
  const selected = useGameStore((s) => s.selected)
  const level = useGameStore((s) => s.level)
  const endless = useGameStore((s) => s.endless)
  const wave = useGameStore((s) => s.wave)
  const waveTotal = useGameStore((s) => s.waveTotal)
  const waveCountdown = useGameStore((s) => s.waveCountdown)
  const progress = useGameStore((s) => s.progress)

  const config = LEVELS[Math.min(level, LEVELS.length - 1)]
  const controlsDisabled = !running || status !== 'playing'

  let waveLabel: string
  let waveCount: string
  if (!running) {
    waveLabel = endless ? '无尽挑战' : '冒险模式'
    waveCount = endless ? `最高 ${endlessBest} 波` : `${config.waves} 波僵尸`
  } else {
    waveLabel = wave === 0 ? '僵尸即将来袭' : wave === waveTotal ? '最后一波' : `第 ${wave} 波来袭`
    waveCount =
      wave === 0 ? `${Math.ceil(waveCountdown)} 秒准备` : `${wave} / ${endless ? '∞' : waveTotal}`
  }

  return (
    <footer className="game-footer">
      <div className="level-indicator">
        <span className="level-number">{endless ? '∞' : String(level + 1).padStart(2, '0')}</span>
        <div>
          <strong>{endless ? '无尽挑战' : config.name}</strong>
          <small>{selectionHint(running, selected)}</small>
        </div>
      </div>

      <div className="wave-progress">
        <div className="progress-label">
          <span id="waveLabel">{waveLabel}</span>
          <span>{waveCount}</span>
        </div>
        <div className="progress-track">
          <div id="progressFill" style={{ width: `${progress * 100}%` }} />
          {FLAGS.map((left, i) => (
            <span key={left} className={i === FLAGS.length - 1 ? 'flag final' : 'flag'} style={{ left }}>
              <Icon name="flag" />
            </span>
          ))}
        </div>
      </div>

      <div className="game-controls">
        <button
          className={speed === 2 ? 'speed-button active' : 'speed-button'}
          title="切换游戏速度"
          disabled={controlsDisabled}
          onClick={() => controller?.toggleSpeed()}
        >
          {speed}×
        </button>
        <button
          className="pause-button"
          aria-label={paused ? '继续游戏' : '暂停游戏'}
          disabled={controlsDisabled}
          onClick={() => controller?.togglePause()}
        >
          <Icon name={paused ? 'play' : 'pause'} />
          <span>{paused ? '继续' : '暂停'}</span>
        </button>
      </div>
    </footer>
  )
}
