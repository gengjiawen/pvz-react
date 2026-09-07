# 僵尸动画素材

`zombie-animations.png` 由内置 imagegen 工具生成，透明 RGBA，实际尺寸 1448 × 1086。
四行依次是普通、路障、铁桶、橄榄球僵尸；每行前四个姿势用于行走，后四个用于啃咬。
生成结果并非严格等宽网格，实际裁剪矩形和脚底锚点记录在 `../game/zombieAnimation.ts`。
运行时保持同一角色的缩放比例，并按脚底锚点对齐，避免逐帧缩放和上下漂移。

## 生成提示词

```text
Use case: stylized-concept
Asset type: production sprite animation atlas for a 2D canvas garden-defense game.
Create one clean TRANSPARENT RGBA PNG sprite sheet, exactly 2048 x 1536 pixels, organized into exactly 8 columns and 4 rows of equal 256 x 384 cells, 32 isolated full-body sprites total. No labels, no grid lines, no background, no checkerboard pixels, no ground, no shadows.
Subject/style: charming cartoon zombies with olive-green skin, bulbous cream eyeballs, small uneven teeth, big heads, brown torn jackets, red striped ties, tattered navy trousers and oversized brown shoes. Dark crisp outlines and soft rich painted shading matching a polished casual garden tower-defense game. All face LEFT in a side / slight three-quarter view, toward plants offscreen to the left. Cute and goofy, no gore.
Each row is ONE IDENTICAL character across its 8 animation frames. Row 1: bareheaded normal zombie. Row 2: same zombie wearing an orange traffic cone. Row 3: same zombie wearing a silver metal bucket. Row 4: sturdier zombie wearing red American football helmet, red shoulder pads, red jersey, white football pants, black cleats.
Within EVERY row, columns 1-4 are a natural slow WALK cycle: column 1 left foot forward planted / right foot back; column 2 passing pose, right knee bent swinging forward, left foot supporting; column 3 right foot forward planted / left foot back; column 4 passing pose, left knee bent swinging forward, right foot supporting. Arms held loosely forward with slight counter motion, hunched shoulders. Feet really change position, do not duplicate static poses.
Within EVERY row, columns 5-8 are an EATING/BITING loop: both feet planted close together in the SAME position across these four frames, knees slightly bent, torso leaning LEFT toward a plant that is NOT shown; column 5 reaching with open hands, head lowered, mouth opening; column 6 mouth WIDE open, lower jaw clearly lowered, elbows bend to grab; column 7 head lunging slightly forward, jaw closed with visible teeth in bite; column 8 head draws back slightly and chews, hands pulling toward mouth. Clearly readable mouth and arm motion, no plant drawn.
Critical alignment: each character fits wholly within its own 256x384 cell with clear empty margins. Feet share EXACT ground baseline at y=356 inside every cell. Pelvis center stays x=145 within every cell. Normal character head top around y=85; cone top around y=30; bucket top around y=55; helmet top around y=60. Body, head, limbs, colors, outfit and scale CONSISTENT frame to frame. Never crop hands, hats or feet. Keep only a subtle 2-4 pixel bob; no stretching or big pose scale changes. Actual transparent background with alpha 0 outside characters.
```
