import { PLANTS } from '../game/config'
import { useAppStore, type Settings } from '../store/appStore'
import { Icon, type IconName } from './Icon'
import { Modal } from './Modal'

const HELP_STEPS: [IconName, string, string][] = [
  ['sun', '01 · 收集阳光', '点击天空落下或向日葵产出的阳光，每颗 +25。也可在设置里开启自动收集。'],
  ['sprout', '02 · 种下防线', '点击上方种子卡，再点击草坪空格。每张卡有独立的准备时间。'],
  ['shield', '03 · 守好每一行', '僵尸从右侧入侵。豌豆直线攻击，坚果阻挡敌人，樱桃炸弹负责救场。'],
  ['trophy', '04 · 迎接胜利', '消灭所有波次的僵尸即可过关。每行有一台一次性割草机，保留它们可获得更多星星。'],
]

const SETTING_ROWS: [keyof Settings, string, string][] = [
  ['sound', '游戏音效', '阳光、豌豆与僵尸，每个动作都有回应。'],
  ['music', '背景音乐', '一段轻快的原创合成旋律，陪你种植。'],
  ['auto', '自动收集阳光', '阳光出现后自动收入，专心布置防线。'],
  ['reduced', '减少粒子效果', '减轻特效与摇摆，获得更平静的体验。'],
]

function Almanac({ thumbs, onClose }: { thumbs: string[]; onClose(): void }) {
  return (
    <Modal onClose={onClose} wide>
      <div className="eyebrow">MEET YOUR GREEN TEAM</div>
      <h2 id="modalTitle">每一株，都有绝活。</h2>
      <p className="modal-intro">认识你的 8 位庭院伙伴，把合适的种子种在合适的地方。</p>
      <div className="almanac-grid">
        {PLANTS.map((plant, index) => (
          <article className="almanac-card" key={plant.id}>
            {thumbs[index] && <img alt={plant.name} src={thumbs[index]} />}
            <h3>{plant.name}</h3>
            <span className="role">{plant.role}</span>
            <p>{plant.desc}</p>
            <div className="plant-numbers">
              <span>
                <Icon name="sun" />
                {plant.cost}
              </span>
              <span>
                <Icon name="clock" />
                {plant.cool} 秒
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="tip-box">
        种植小贴士：向日葵放后排，坚果墙放前排。让寒冰射手拖慢敌人，再用双发射手集中火力。樱桃炸弹留给最危险的一刻。
      </div>
    </Modal>
  )
}

function Help({ onClose }: { onClose(): void }) {
  return (
    <Modal onClose={onClose}>
      <div className="eyebrow">A SMALL GUIDE TO BIG VICTORIES</div>
      <h2 id="modalTitle">守住庭院，从这里开始。</h2>
      <p className="modal-intro">规则很简单，漂亮的防守需要一点小策略。</p>
      <div className="help-grid">
        {HELP_STEPS.map(([icon, title, desc]) => (
          <div className="help-item" key={title}>
            <Icon name={icon} />
            <div>
              <strong>{title}</strong>
              <p>{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="key-help">
        <kbd>1—8</kbd> 选择植物　<kbd>S</kbd> 铲子　<kbd>空格</kbd> 暂停 / 继续
        <br />
        <kbd>方向键</kbd> 选择草坪　<kbd>Enter</kbd> 种植　<kbd>C</kbd> 收集全部阳光
        <br />
        <kbd>Esc</kbd> 取消选择 / 暂停　<kbd>Shift + 点击</kbd> 种植后保持选择
      </div>
      <div className="tip-box">
        建议开局：先在左侧种下 2–3
        株向日葵，留出 100 阳光。第一只僵尸出现后，在同一行种豌豆射手。随后补齐各行火力。手机横屏游玩，视野更舒展。
      </div>
    </Modal>
  )
}

function SettingsPanel({ onClose }: { onClose(): void }) {
  const settings = useAppStore((s) => s.settings)
  const toggleSetting = useAppStore((s) => s.toggleSetting)
  const openModal = useAppStore((s) => s.openModal)

  return (
    <Modal onClose={onClose}>
      <div className="eyebrow">MAKE YOURSELF AT HOME</div>
      <h2 id="modalTitle">庭院小偏好</h2>
      <p className="modal-intro">按你的节奏，享受这一场保卫战。</p>
      <div className="settings-section">
        {SETTING_ROWS.map(([key, title, desc]) => (
          <div className="setting-row" key={key}>
            <div>
              <strong>{title}</strong>
              <small>{desc}</small>
            </div>
            <button
              className={settings[key] ? 'toggle on' : 'toggle'}
              role="switch"
              aria-checked={settings[key]}
              aria-label={title}
              onClick={() => toggleSetting(key)}
            />
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={() => openModal('help')}>
        查看玩法与快捷键
      </button>
      <div className="confetti-note">通关星级与设置会自动保存在当前浏览器中。</div>
    </Modal>
  )
}

export function GameModals({ thumbs }: { thumbs: string[] }) {
  const modal = useAppStore((s) => s.modal)
  const closeModal = useAppStore((s) => s.closeModal)

  if (modal === 'almanac') return <Almanac thumbs={thumbs} onClose={closeModal} />
  if (modal === 'help') return <Help onClose={closeModal} />
  if (modal === 'settings') return <SettingsPanel onClose={closeModal} />
  return null
}
