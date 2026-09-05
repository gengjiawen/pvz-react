import { useEffect, useRef, useState } from 'react'
import { useController } from '../controller/context'
import { PLANTS } from '../game/config'
import type { PlantDef } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { Icon } from './Icon'

function SunMeter() {
  const sun = useGameStore((s) => s.sun)
  const previous = useRef(sun)
  const [pops, setPops] = useState(0)

  useEffect(() => {
    if (sun > previous.current) setPops((n) => n + 1)
    previous.current = sun
  }, [sun])

  return (
    <div className={pops ? 'sun-meter pop' : 'sun-meter'}>
      <div className="sun-symbol">
        <Icon name="sun" />
      </div>
      {/* Remounting on each gain restarts the pop animation. */}
      <strong key={pops}>{sun}</strong>
      <span>阳光储备</span>
    </div>
  )
}

interface SeedCardProps {
  index: number
  plant: PlantDef
  thumb?: string
  cool: number
  selected: boolean
  affordable: boolean
  onSelect(index: number): void
  onHover(index: number | null, element: HTMLButtonElement | null): void
}

function SeedCard({ index, plant, thumb, cool, selected, affordable, onSelect, onHover }: SeedCardProps) {
  const className = [
    'seed-card',
    selected ? 'selected' : '',
    affordable ? '' : 'unaffordable',
  ]
    .filter(Boolean)
    .join(' ')

  const label = `${plant.name}，${plant.cost} 阳光${cool > 0 ? `，准备中 ${Math.ceil(cool)} 秒` : ''}，快捷键 ${index + 1}`

  return (
    <button
      className={className}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onSelect(index)}
      onMouseEnter={(e) => onHover(index, e.currentTarget)}
      onMouseLeave={() => onHover(null, null)}
    >
      <span className="seed-key">{index + 1}</span>
      <span className="seed-name">{plant.name}</span>
      {thumb && <img alt="" src={thumb} draggable={false} />}
      <span className="seed-price">
        <Icon name="sun" />
        {plant.cost}
      </span>
      <span className="cooldown" style={{ transform: `scaleY(${Math.max(0, cool / plant.cool)})` }} />
      <span className="cool-time">{cool > 0.1 ? Math.ceil(cool) : ''}</span>
    </button>
  )
}

export function SeedBank({ thumbs }: { thumbs: string[] }) {
  const controller = useController()
  const sun = useGameStore((s) => s.sun)
  const cooldowns = useGameStore((s) => s.cooldowns)
  const selected = useGameStore((s) => s.selected)
  const [tooltip, setTooltip] = useState<{ index: number; left: number } | null>(null)

  const handleHover = (index: number | null, element: HTMLButtonElement | null) => {
    if (index === null || !element || matchMedia('(hover: none)').matches) {
      setTooltip(null)
      return
    }
    setTooltip({ index, left: Math.min(element.offsetLeft, window.innerWidth - 300) })
  }

  const handleSelect = (index: number) => {
    setTooltip(null)
    controller?.selectPlant(index)
  }

  const hovered = tooltip === null ? null : PLANTS[tooltip.index]

  return (
    <div className="seed-bank">
      <SunMeter />
      <div className="seed-divider" />
      <div className="seed-cards" role="group" aria-label="植物种子">
        {PLANTS.map((plant, index) => (
          <SeedCard
            key={plant.id}
            index={index}
            plant={plant}
            thumb={thumbs[index]}
            cool={cooldowns[index] ?? 0}
            selected={selected === index}
            affordable={sun >= plant.cost}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        ))}
      </div>
      <div className="seed-divider last-divider" />
      <button
        className={selected === 'shovel' ? 'shovel selected' : 'shovel'}
        aria-pressed={selected === 'shovel'}
        title="铲除植物（快捷键 S）"
        onClick={() => controller?.selectShovel()}
      >
        <Icon name="shovel" />
        <span>
          铲子 <kbd>S</kbd>
        </span>
      </button>

      <div
        className="seed-tooltip"
        role="tooltip"
        style={hovered ? { display: 'block', left: tooltip!.left } : undefined}
      >
        {hovered && (
          <>
            <strong>
              {hovered.name}
              <small>{hovered.role}</small>
            </strong>
            {hovered.desc}
          </>
        )}
      </div>
    </div>
  )
}
