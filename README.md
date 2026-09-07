# 植物大战僵尸 · 庭院保卫战（React 版）

在线试玩：**<https://pvz-react.vercel.app>**

把 [seth-xh/pvz](https://github.com/seth-xh/pvz) 的单文件网页游戏（一个约 6.7 MB 的 `index.html`）重写为 Vite + React + TypeScript 工程。保留原版玩法、数值和界面样式，游戏逻辑与 React 解耦，图片从 base64 内联改为构建产物；另补充了僵尸的行走与啃咬动画。

> 大陆网络访问 `*.vercel.app` 通常需要代理。

## 技术栈

| 依赖 | 版本 |
| --- | --- |
| Vite | 8.2.2（rolldown + lightningcss） |
| React / React DOM | 19.2.8 |
| TypeScript | 7.0.2（原生编译器） |
| @vitejs/plugin-react | 6.1.1 |
| zustand | 5.0.15 |
| pnpm / Node | 11.8.0 / 24.x |

## 运行

```bash
pnpm install
pnpm dev        # 开发服务器
pnpm build      # tsc -b && vite build
pnpm preview    # 预览 dist/
pnpm typecheck  # 只做类型检查
```

## 结构

```
src/
  game/         无框架依赖的游戏内核，不 import React
    types.ts          实体与事件类型（GameEvent 为可辨识联合）
    config.ts         植物/僵尸/关卡数值、场地几何、精灵图切片矩形
    LawnGame.ts       状态机与固定步长模拟
    GardenRenderer.ts Canvas 绘制，切图为 12 张离屏 canvas + 缩略图
    zombieAnimation.ts 僵尸动画选帧、精灵图裁剪矩形与脚底锚点
    GardenAudio.ts    Web Audio 合成音效与循环旋律（无音频文件）
  store/        zustand
    gameStore.ts      每帧写入的 HUD 快照
    appStore.ts       设置 / 记录 / 弹窗，persist 到 localStorage
  controller/   GameController：requestAnimationFrame 循环与输入，衔接内核与 store
  hooks/        useGarden（初始化画布）、useKeyboard、useFocusTrap
  ui/           组件，沿用原版 class 名
  styles/       原版样式表
```

数据流是单向的：`GameController` 驱动 `LawnGame` 与 `GardenRenderer`，并把 HUD 写进 `gameStore`；组件用 selector 订阅，通过 context 拿到 controller 调用命令。React 不参与逐帧渲染——Canvas 每帧从实体直接绘制，HUD 每 0.09 秒才推送一次。

模拟采用固定步长 1/60 秒，单帧最多追赶 12 步；2 倍速只是每帧多跑一次逻辑，不改变步长。

## 与原版的差异

- 两张 PNG（合计约 5 MB）成为带 hash 的构建产物，`assetsInlineLimit: 0` 确保不被内联回 JS。
- 新增一张透明僵尸动画图：四种僵尸各有 4 帧行走、4 帧啃咬。行走按实际移动距离选帧；完整啃咬动作约 1.26 秒一轮，伤害仍按原来的 0.42 秒间隔结算，随暂停、倍速和寒冰减速同步。
- 庭院与原版前院一致，使用 5 行 × 9 列；背景草带在加载时统一到每行 124 像素，五行全部可种植。植物、僵尸、割草机、种植预览与鼠标、键盘操作共用相同的格子坐标。
- 全局变量与 `document.getElementById` 的手工 HUD 刷新，换成 zustand + selector。
- 逻辑保持等价：即时击杀原本写作 `99999` 伤害，这里用 `Infinity`。

## 关于素材

美术素材来自上游仓库，上游未附带任何 license；游戏本身也是对 PopCap / EA《Plants vs. Zombies》的致敬作。这份移植同样只适合自己学习和本地把玩，不要用于分发或商业用途。

新增的 `src/assets/zombie-animations.png` 使用内置 imagegen 工具生成，提示词及切图说明见 [素材说明](src/assets/zombie-animations.md)。
