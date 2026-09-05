import { useController } from '../controller/context'
import { LEVELS } from '../game/config'
import type { EndSummary } from '../game/types'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Icon } from './Icon'

const LAST_LEVEL = LEVELS.length - 1

function describe(result: EndSummary) {
  if (result.won) {
    return result.level === LAST_LEVEL
      ? '阳光、勇气，还有一点种植天赋。你通关了！'
      : '又是平安的一天。向下一片庭院出发吧。'
  }
  return result.endless
    ? `你守到了第 ${result.wave} 波。下一次，再多坚持一波。`
    : '多种向日葵，别忘了给每一行安排火力。'
}

export function ResultOverlay({ result, thumbs }: { result: EndSummary; thumbs: string[] }) {
  const controller = useController()
  const ref = useFocusTrap<HTMLDivElement>(true, '.primary-button')

  const { won, endless, level } = result
  const stats: [string, number][] = [
    ['得分', result.score],
    ['击败僵尸', result.kills],
    [endless ? '坚守波次' : '种下植物', endless ? result.wave : result.planted],
  ]

  const nextLabel =
    won && level < LAST_LEVEL ? `下一关 · ${LEVELS[level + 1].name}` : won ? '挑战无尽模式' : '再来一次'

  const playNext = () => {
    if (won && level < LAST_LEVEL) controller?.start(level + 1, false)
    else if (won) controller?.start(LAST_LEVEL, true)
    else controller?.start(level, endless)
  }

  return (
    <div className="overlay dialog-overlay">
      <div className="result-card" role="dialog" aria-modal="true" aria-labelledby="resultTitle" ref={ref}>
        <div id="resultIllustration">
          {/* A sunflower for a win, a zombie for a loss. */}
          <img alt="" src={thumbs[won ? 0 : 8]} />
        </div>
        <div className="eyebrow">{won ? 'THE LAWN IS YOURS' : 'EVERY GARDENER GROWS'}</div>
        <h2 id="resultTitle">{won ? '庭院，守住了！' : endless ? '这是一场漂亮的防守' : '他们突破了防线'}</h2>
        <p>{describe(result)}</p>

        <div className="result-stars">
          {won &&
            [0, 1, 2].map((i) => (
              <Icon key={i} name="star" className={i < result.stars ? 'earned' : undefined} />
            ))}
        </div>

        <div className="result-stats">
          {stats.map(([name, value]) => (
            <div className="stat" key={name}>
              <strong>{value}</strong>
              <span>{name}</span>
            </div>
          ))}
        </div>

        <button className="primary-button" onClick={playNext}>
          {nextLabel} <Icon name="arrow" />
        </button>
        <button className="quiet-button" onClick={() => controller?.home()}>
          返回主菜单
        </button>
      </div>
    </div>
  )
}
