import { useController } from '../controller/context'
import { LEVELS } from '../game/config'
import { useAppStore } from '../store/appStore'
import { Icon } from './Icon'

export function HomeOverlay() {
  const controller = useController()
  const mode = useAppStore((s) => s.mode)
  const selectedLevel = useAppStore((s) => s.selectedLevel)
  const records = useAppStore((s) => s.records)
  const endlessBest = useAppStore((s) => s.endlessBest)
  const setMode = useAppStore((s) => s.setMode)
  const setSelectedLevel = useAppStore((s) => s.setSelectedLevel)
  const openModal = useAppStore((s) => s.openModal)

  const endless = mode === 'endless'
  const description = endless
    ? `不断升级的僵尸浪潮。${endlessBest ? `最高纪录：第 ${endlessBest} 波。` : '你的防线，能坚持多久？'}`
    : '循序渐进的三段冒险，从第一缕阳光开始。'

  const chooseMode = (next: 'adventure' | 'endless') => {
    setMode(next)
    controller?.setPreview(selectedLevel, next === 'endless')
  }

  const chooseLevel = (level: number) => {
    setSelectedLevel(level)
    controller?.setPreview(level, endless)
  }

  return (
    <div className="overlay home-overlay">
      <div className="welcome-card">
        <div className="eyebrow">
          <span /> 草坪保卫计划 · 01
        </div>
        <h1>
          阳光正好。
          <br />
          僵尸<span>来了。</span>
        </h1>
        <p>
          种下你的防线，守住这片小小的庭院。
          <br />
          老朋友，新一场战斗。
        </p>
        <div className="home-rule" />

        <div className="mode-tabs" role="tablist" aria-label="游戏模式">
          <button
            className={endless ? '' : 'active'}
            role="tab"
            aria-selected={!endless}
            onClick={() => chooseMode('adventure')}
          >
            冒险模式
          </button>
          <button
            className={endless ? 'active' : ''}
            role="tab"
            aria-selected={endless}
            onClick={() => chooseMode('endless')}
          >
            无尽挑战
          </button>
        </div>

        <div className={endless ? 'level-picker hidden' : 'level-picker'}>
          {LEVELS.map((level, index) => (
            <button
              key={level.name}
              className={selectedLevel === index ? 'level-chip active' : 'level-chip'}
              aria-pressed={selectedLevel === index}
              onClick={() => chooseLevel(index)}
            >
              <span>0{index + 1}</span>
              {level.name}
              {!!records[index]?.stars && <em className="level-earned">{records[index].stars}★</em>}
            </button>
          ))}
        </div>

        <p className="mode-description">{description}</p>

        <button
          className="primary-button start-button"
          onClick={() => controller?.start(selectedLevel, endless)}
        >
          <span>开始保卫庭院</span>
          <Icon name="arrow" />
        </button>

        <div className="welcome-footer">
          <span>
            <Icon name="mouse" /> 点选植物，再点击草坪
          </span>
          <button onClick={() => openModal('help')}>第一次玩？</button>
        </div>
      </div>

      <div className="home-caption">
        <span>HOME SWEET HOME</span>
        <strong>
          我的草坪，
          <br />
          我说了算。
        </strong>
        <span className="caption-line" />
        <small>Est. 2009 · 经典玩法，焕新庭院</small>
      </div>
    </div>
  )
}
