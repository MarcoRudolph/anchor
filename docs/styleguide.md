---
description: "Styleguide reverse-engineered from the Floema site (Awwwards SOTD 2026-05-13). Source: awwwards.com/sites/floema#creator + computed styles on floema.com/en."
paths:
  - "./floema-styleguide.md"
  - "./floema-hero.png"
---

# Floema — Styleguide

**Source site:** https://www.floema.com/en
**Awwwards page:** https://www.awwwards.com/sites/floema (SOTD May 13, 2026, 7.65/10)
**Studio:** Bürocratik PRO
**Reference screenshot:** `./floema-hero.png`

Brand voice: *Spaces for people, made for life.* Sustainable urban furniture and signage for natural spaces — editorial, calm, sculptural, photographic.

---

## 1. Color Palette

Awwwards lists a **2-color palette**. The actual page surface uses a warm off-white as the dominant canvas, with the highlight yellow used for accents/inversions and the near-black for type and dark sections.

| Token              | HEX        | Role                                                       |
|--------------------|------------|------------------------------------------------------------|
| `--color-bg`       | `#F2EFEA`  | Page background (warm cream / paper).                      |
| `--color-ink`      | `#241F21`  | Primary type, dark inverted sections (per Awwwards).       |
| `--color-accent`   | `#E9E778`  | Highlight yellow — CTAs, hovers, full-bleed accent panels. |

**Rules**
- Default canvas = cream `#F2EFEA`, type = ink `#241F21`. Contrast ratio ≈ 13:1 (AAA).
- Inverted sections flip to ink background with cream type.
- Yellow `#E9E778` is used sparingly: a single accent moment per fold (cursor, hover state, big-quote block, sustainability section).
- No gradients. Pure flat color, paired with full-bleed photography.

---

## 2. Typography

Two families. **Zimula** (display serif) does almost all the visible work — headlines, body, captions, labels. A platform sans-serif stack handles UI chrome (cookie banner, nav micro-labels).

| Family   | Use                                                    | Weight |
|----------|--------------------------------------------------------|--------|
| Zimula   | All editorial type (h1–h4, body, captions)             | 400    |
| sans-serif (system stack) | Nav micro-caps, utility/UI text         | 400 / 600 / 700 |

### Type scale (measured from production page)

| Role              | Size  | Line-height | Tracking  | Element |
|-------------------|-------|-------------|-----------|---------|
| Display / H1      | 64px  | 67.2px (1.05) | -2.56px (-0.04em) | Hero title |
| H2                | 56px  | 61.6px (1.10) | -2.24px (-0.04em) | Section headline |
| H4 large          | 48px  | 50.4px (1.05) | -1.92px (-0.04em) | Sub-hero pull text |
| H4 medium         | 24px  | 30px   (1.25) | -0.96px (-0.04em) | Inline labels (e.g. "Floema® Est. 2007") |
| Body L            | 20px  | 26px   (1.30) | -0.40px (-0.02em) | Lead paragraphs |
| Body              | 18px  | 23.4px (1.30) | -0.36px (-0.02em) | Card titles |
| Body S            | 16px  | 22.4px (1.40) | -0.32px (-0.02em) | Default paragraph |
| Caption           | 14px  | 19.6px (1.40) | -0.28px (-0.02em) | Tags, metadata |
| Micro-caps        | 12px  | 16.8px (1.40) | -0.24px, uppercase | Nav labels, tags |
| UI micro          | 11px  | 15.4px (1.40) | 0          | Counters (+4 etc.) |
| Nav link          | 16px  | 27.2px (1.70) | 0, uppercase | Top-nav items (sans-serif) |

**Rules**
- Negative tracking on every Zimula size: roughly **−0.04em** for display, **−0.02em** for body. Never set Zimula at 0 tracking.
- All-caps used only at ≤16px (nav + micro-caps), never in display.
- Single weight (400). Hierarchy is built from size, not weight.
- Tight line-heights for display (1.05–1.10), generous for body (1.30–1.40).

---

## 3. Layout & Composition

- Full-bleed photography intercut with single-column editorial typography.
- Generous negative space; hero text is large, surrounded by paper-white margin.
- Asymmetric editorial blocks (label + headline + image trio), not card grids.
- Sections divided by color swap (cream → ink → cream → yellow accent), not rules or shadows.

---

## 4. Motion & Interaction

Awwwards highlights seven signature interactions (Bürocratik's "Elements" reel):

1. **Sustainability — Material 3D** (mouse-driven 3D object inspection)
2. **Sustainability — Scroll Interaction** (scroll-bound material/scene transition)
3. **Menu & Search Interaction** (full-screen overlay menu)
4. **Scroll Video Zooming** (video element zooms with scroll position)
5. **Product Page** (custom layout per product, not a template)
6. **About Page Header** (large-type header with motion entry)
7. **Homepage Header** (sequenced reveal on load)

**Stack:** WebGL + GSAP, Nuxt.js (Vue).

**Motion principles**
- Scroll is the primary input — most interactions are scroll-bound, not autoplaying.
- 3D pieces respond to mouse position, never spin idle.
- Page entries use staggered reveals on load (one orchestrated moment, not many).
- Transitions between routes are full-page; the menu/search overlay covers viewport.
- Easing favors long, slow curves — sculptural, never bouncy.

---

## 5. Imagery

- Photographic, documentary, color-graded warm.
- Subjects: products in real urban/natural settings, materials, people interacting with the furniture.
- Always full-bleed or full-column; no rounded corners, no drop-shadows, no decorative frames.

---

## 6. Iconography & Chrome

- Minimal. Arrow glyph `↓` / `→` for directional cues (e.g. "Recent News ↓", "SEE URBAN PRODUCTS").
- No icon system; arrows + type carry navigation.
- No outlined buttons — CTAs are uppercase sans-serif text with an arrow, not a pill.

---

## 7. CSS Token Starter

```css
:root {
  /* Color */
  --color-bg: #F2EFEA;
  --color-ink: #241F21;
  --color-accent: #E9E778;

  /* Type */
  --font-display: "Zimula", "Times New Roman", serif;
  --font-ui: system-ui, -apple-system, "Segoe UI", sans-serif;

  /* Scale */
  --fs-display: 64px;  --lh-display: 1.05; --ls-display: -0.04em;
  --fs-h2:      56px;  --lh-h2: 1.10;      --ls-h2: -0.04em;
  --fs-h4-lg:   48px;  --lh-h4-lg: 1.05;   --ls-h4-lg: -0.04em;
  --fs-body-l:  20px;  --lh-body-l: 1.30;  --ls-body-l: -0.02em;
  --fs-body:    16px;  --lh-body: 1.40;    --ls-body: -0.02em;
  --fs-caps:    12px;  --lh-caps: 1.40;    --ls-caps: -0.02em;
}

body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-display);
  font-weight: 400;
}

h1 {
  font-size: var(--fs-display);
  line-height: var(--lh-display);
  letter-spacing: var(--ls-display);
}

.nav-link {
  font-family: var(--font-ui);
  font-size: 16px;
  letter-spacing: 0;
  text-transform: uppercase;
}
```

---

## 8. Categorization (Awwwards tags)

Business & Corporate · E-Commerce · Promotional · Photographic · Storytelling · 3D · Header Design

## 9. Awwwards Scores (reference)

- **SOTD:** 7.65 / 10 — Design 7.77 · Usability 7.38 · Creativity 7.82 · Content 7.64
- **Dev Award:** 7.67 / 10 — Animations 8.20 leads; Accessibility 7.00 is the weakest dimension.

> Takeaway: if you copy this aesthetic, invest in accessibility — the design's low-contrast moments (yellow-on-cream) and motion-heavy interactions are the cited weak spot.
