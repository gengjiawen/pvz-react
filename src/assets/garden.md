# 庭院背景

`garden.png` 使用内置 imagegen 编辑生成，1672 × 941。以原版白天前院的 5 行 × 9 列为结构参考。

生成素材包含五条草带，但行高不精确。`GardenRenderer.prepareBackground()` 在加载时按测得的源边界 `[140, 245, 350, 463, 583, 760]`（1440 × 810 坐标）分段绘制，将五条草带统一到 `FIELD` 的等高行；每行 124 像素，从 y=140 到 y=760。处理结果缓存供后续帧使用。格子、落脚点、选中框与输入都由同一份 `FIELD` 定义。

## 原版结构参考

- [白天前院：5 行 × 9 列](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3590/0000008164.1920x1080.jpg)
- [泳池：6 行，其中两行水路](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3590/0000008156.1920x1080.jpg)

## 生成提示词

```text
Use case: precise-object-edit.
Asset type: production garden game background, exact five-row lawn.
Input image 1: EDIT TARGET, our detailed sunny garden illustration.
Input image 2: STRUCTURAL REFERENCE ONLY, original Plants vs Zombies daytime lawn gameplay with FIVE rows and NINE columns. Do not copy its characters, UI, text, or illustration style.
Task: Repaint the ENTIRE open grass rectangle of image 1 so it contains EXACTLY FIVE equally tall horizontal mowing stripes from hedge to bottom border. The old image has six stripes: discard ALL its old internal stripe boundaries and replace them with FOUR equally spaced internal boundaries. This is a full repartition of the grass, not adding shrubbery.
Five stripes from top to bottom: medium green, light yellow-green, medium green, light yellow-green, medium green. All five have equal height and match the existing textured hand-painted grass. The FIRST row immediately touches the existing hedge, the FIFTH row immediately touches the bottom flower border. Exactly four subtle straight horizontal color transitions across the grass. No sixth stripe, no partial grass strip, no extra narrow stripe along hedge or bottom.
Precise image 1 geometry, 1672x941 reference: grass begins at y=163 and ends at y=882. The FOUR new internal color boundaries are at y=307,451,595,739. Grass spans approximately x=290..1480 with existing natural edges. Keep its full current footprint. Every band is about144px tall. No old boundaries at273,390,520,646,775 should remain.
Invariants: Preserve original image 1 house, roof, sky, white fence, low hedge, left and right stone paths, flowers, sunlight, painterly texture, 16:9 framing. ONLY repartition/repaint grass inside existing lawn. No additional hedge. No characters, plants, mowers, shadows of characters, checkerboard columns, grid outlines, water, lettering, labels, UI or watermarks.
Before finalizing, count the stripes: ONE medium green top row, TWO lighter row, THREE medium middle row, FOUR lighter row, FIVE medium green bottom row. Entire lawn = FIVE equal rows.
```

## 调整提示词

```text
Use case: precise-object-edit.
Input image is an edit target. It now correctly has FIVE horizontal lawn stripes, but the bottom stripe is almost twice as tall as the others. Fix only this unequal sizing.
Keep FIVE stripes, same alternating colors medium/light/medium/light/medium. Redistribute them to five EQUAL HEIGHT rows across the FULL existing grass rectangle, from the hedge at y=163 to the flowers at y=882 in this 1672x941 image. Each row must be144px tall. This means MOVE each internal boundary DOWN:
boundary1 from about y=278 to y=307;
boundary2 from about y=400 to y=451;
boundary3 from about y=524 to y=595;
boundary4 from about y=661 to y=739.
The final bottom dark stripe must only be y=739..882, NOT y=661..882. The third dark stripe must only be y=451..595. Top dark stripe y=163..307. Two lighter stripes y=307..451 and y=595..739. These five equally tall green strips fill the entire lawn.
Repaint the grass as needed, remove all current internal transition lines and draw the new ones at those positions. Make all FIVE strips exactly the same apparent vertical height in the image, regardless of perspective.
Preserve all scenery outside the lawn, original detailed painting style, house, paths, fence, hedge, flowers, image size and framing. No characters, objects, text or UI. Only change lawn stripe heights.
```
