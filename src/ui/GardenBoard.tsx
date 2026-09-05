import type { RefObject } from 'react'
import { useController } from '../controller/context'
import { FIELD, LEVELS } from '../game/config'
import type { LoadStatus } from '../hooks/useGarden'
import { useAppStore } from '../store/appStore'
import { useGameStore } from '../store/gameStore'
import { HomeOverlay } from './HomeOverlay'
import { Icon } from './Icon'
import { PauseOverlay } from './PauseOverlay'
import { ResultOverlay } from './ResultOverlay'

const WEATHER = ['晴朗 · 适宜种植', '午后 · 危机渐近', '黄昏 · 全力以赴']

function FieldTopbar() {
  const running = useGameStore((s) => s.running)
  const level = useGameStore((s) => s.level)
  const endless = useGameStore((s) => s.endless)
  const config = LEVELS[Math.min(level, LEVELS.length - 1)]

  const location = !running
    ? '疯狂戴夫的后院'
    : endless
      ? '后院 · 无尽防线'
      : `冒险 ${level + 1} · ${config.name}`

  return (
    <div className="field-topbar">
      <span className="location-pill">
        <Icon name="pin" />
        <span>{location}</span>
      </span>
      <span className="weather-pill">
        <Icon name="sun" />
        <span>{running ? WEATHER[level] : WEATHER[0]}</span>
      </span>
    </div>
  )
}

function WaveBanner() {
  const banner = useAppStore((s) => s.banner)
  return (
    <div className={banner ? 'wave-banner visible' : 'wave-banner'} aria-live="polite">
      {banner?.text}
      {banner?.sub && <small>{banner.sub}</small>}
    </div>
  )
}

function Toast() {
  const toast = useAppStore((s) => s.toast)
  return (
    <div className={toast ? 'toast visible' : 'toast'} role="status">
      {toast?.text}
    </div>
  )
}

function LoadingCover({ status }: { status: LoadStatus }) {
  if (status === 'error') {
    return (
      <div className="loading-cover">
        <strong>庭院资源加载失败</strong>
        <span>请检查网络后刷新页面。</span>
      </div>
    )
  }
  return (
    <div className="loading-cover">
      <div className="loading-sun">
        <Icon name="sun" />
      </div>
      <strong>正在唤醒你的庭院…</strong>
      <span>让阳光再飞一会儿</span>
    </div>
  )
}

interface GardenBoardProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  thumbs: string[]
  status: LoadStatus
}

export function GardenBoard({ canvasRef, thumbs, status }: GardenBoardProps) {
  const controller = useController()
  const running = useGameStore((s) => s.running)
  const paused = useGameStore((s) => s.paused)
  const result = useAppStore((s) => s.result)

  return (
    <div className="garden-wrap">
      <canvas
        id="garden"
        ref={canvasRef}
        width={FIELD.w}
        height={FIELD.h}
        tabIndex={0}
        aria-label="5 行 9 列草坪。数字 1 至 8 选择植物，方向键选择格子，回车种植。"
        onPointerMove={(e) => controller?.pointerMove(e)}
        onPointerLeave={() => controller?.pointerLeave()}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.preventDefault()
          controller?.pointerDown(e)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          controller?.clearSelection()
        }}
      >
        请使用支持 Canvas 的浏览器打开游戏。
      </canvas>

      <FieldTopbar />
      <WaveBanner />
      <Toast />

      {!running && <HomeOverlay />}
      {paused && <PauseOverlay thumbs={thumbs} />}
      {result && <ResultOverlay result={result} thumbs={thumbs} />}
      {status !== 'ready' && <LoadingCover status={status} />}
    </div>
  )
}
