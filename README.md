# 植物大战僵尸 · 庭院保卫战（React 版）

把 [seth-xh/pvz](https://github.com/seth-xh/pvz) 的单文件网页游戏（一个约 6.7 MB 的 `index.html`）重写为 Vite + React + TypeScript 工程。玩法、数值、美术和样式与原版一致，改动的是工程结构：游戏逻辑与 React 解耦，两张精灵图从 base64 内联改为构建产物。

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
- 全局变量与 `document.getElementById` 的手工 HUD 刷新，换成 zustand + selector。
- 逻辑保持等价：即时击杀原本写作 `99999` 伤害，这里用 `Infinity`。

## 关于素材

美术素材来自上游仓库，上游未附带任何 license；游戏本身也是对 PopCap / EA《Plants vs. Zombies》的致敬作。这份移植同样只适合自己学习和本地把玩，不要用于分发或商业用途。
