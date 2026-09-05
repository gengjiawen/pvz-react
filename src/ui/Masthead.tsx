import { useController } from '../controller/context'
import { useAppStore } from '../store/appStore'
import { useGameStore } from '../store/gameStore'
import { Icon, IconSvg } from './Icon'

const clock = (seconds: number) => {
  const total = Math.floor(seconds)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function SessionLabel() {
  const running = useGameStore((s) => s.running)
  const endless = useGameStore((s) => s.endless)
  const level = useGameStore((s) => s.level)
  const time = useGameStore((s) => s.time)
  const kills = useGameStore((s) => s.kills)

  if (!running) return <span>一个平静的下午，直到他们出现。</span>
  const label = endless ? '无尽挑战' : `冒险 ${level + 1}`
  return <span>{`${label}  /  ${clock(time)}  /  击败 ${kills} 只僵尸`}</span>
}

export function Masthead() {
  const controller = useController()
  const openModal = useAppStore((s) => s.openModal)
  const showToast = useAppStore((s) => s.showToast)
  const toggleSetting = useAppStore((s) => s.toggleSetting)
  const sound = useAppStore((s) => s.settings.sound)

  const goHome = (event: React.MouseEvent) => {
    event.preventDefault()
    const { running, status, paused } = useGameStore.getState()
    if (running && status === 'playing' && !paused) controller?.togglePause()
    else controller?.home()
  }

  const toggleSound = () => {
    toggleSetting('sound')
    controller?.audio.init()
    showToast(sound ? '游戏声音已关闭' : '游戏声音已开启')
  }

  return (
    <header className="masthead">
      <a className="brand" href="#" onClick={goHome} aria-label="返回主菜单">
        <span className="brand-mark">
          <IconSvg name="sprout" />
        </span>
        <span className="brand-name">
          植物<span>大战</span>僵尸<small>GARDEN DEFENDERS</small>
        </span>
      </a>

      <div className="session-label">
        <span className="live-dot" />
        <SessionLabel />
      </div>

      <nav className="header-actions" aria-label="游戏工具">
        <button className="text-button" onClick={() => openModal('almanac')} aria-label="植物图鉴">
          <Icon name="book" />
          <span>植物图鉴</span>
        </button>
        <button
          className="icon-button"
          onClick={toggleSound}
          title={sound ? '关闭声音' : '开启声音'}
          aria-label={sound ? '关闭声音' : '开启声音'}
        >
          <Icon name={sound ? 'volume' : 'muted'} />
        </button>
        <button
          className="icon-button"
          onClick={() => void controller?.toggleFullscreen()}
          title="全屏"
          aria-label="全屏"
        >
          <Icon name="expand" />
        </button>
        <button
          className="icon-button"
          onClick={() => openModal('settings')}
          title="设置与帮助"
          aria-label="设置与帮助"
        >
          <Icon name="settings" />
        </button>
      </nav>
    </header>
  )
}
