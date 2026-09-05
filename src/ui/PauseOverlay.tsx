import { useController } from '../controller/context'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Icon } from './Icon'

export function PauseOverlay({ thumbs }: { thumbs: string[] }) {
  const controller = useController()
  const ref = useFocusTrap<HTMLDivElement>(true)

  return (
    <div className="overlay dialog-overlay">
      <div className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pauseTitle" ref={ref}>
        <span className="eyebrow">TAKE A LITTLE BREAK</span>
        <div className="pause-flower">{thumbs[0] && <img alt="向日葵" src={thumbs[0]} />}</div>
        <h2 id="pauseTitle">花儿等你回来</h2>
        <p>庭院已暂停，慢慢来。</p>
        <button className="primary-button" onClick={() => controller?.togglePause()}>
          继续保卫庭院 <Icon name="play" />
        </button>
        <button className="secondary-button" onClick={() => controller?.restart()}>
          重新开始
        </button>
        <button className="quiet-button" onClick={() => controller?.home()}>
          返回主菜单
        </button>
      </div>
    </div>
  )
}
