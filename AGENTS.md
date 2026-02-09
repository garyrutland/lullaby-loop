# AI Development Rules for Luma Loop

## 1. Project Identity
* **Goal:** A sensory regulation PWA for a neurodiverse child.
* **Core Philosophy:** Low stimulation, dark mode only, synesthesia (touch=sound).

## 2. Tech Stack (Strict)
* **Single File Only:** Maintain everything in `index.html`. No build steps.
* **No Frameworks:** Vanilla JS + HTML5 Canvas only.
* **Performance:** Must run at 60fps on iPad (use requestAnimationFrame).

## 3. Key Mechanics
* **Sunset Timer:** Fades screen/audio over 15-120m.
* **Ghost Mode:** Auto-play after 2s of idle time.
* **Audio:** Web Audio API only (no external assets).