# Fateme Ghandi Interactive Portfolio

Interactive 3D portfolio landing page built with Vite, Three.js, plain JavaScript, and CSS.

This is the clean source project from the 2026-08-07 handoff snapshot.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. It is usually:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

## Export Single-File Preview

After building:

```bash
npm run export:single
```

This writes:

```text
../share/portfolio-3d-preview.html
```

## Main Files

- `src/main.js` - Three.js scene, section markup, scroll timing, objects, menu behavior, and interactions.
- `src/styles.css` - layout, typography, responsive behavior, cards, menu, contact, footer.
- `public/fonts/` - embedded Comic Sans font files.
- `tools/build-single-file.mjs` - creates a portable HTML preview with CSS, JS, and fonts embedded.

## Current Sections

1. Loader
2. Hero 3D morph
3. About
4. Services intro
5. Services cards
6. Projects intro
7. Project cards
8. Case Studies intro
9. Case Study cards
10. Contact
11. Footer

## Before Editing

Read:

```text
../docs/AI_AGENT_HANDOFF.md
../docs/PROJECT_OVERVIEW.md
../docs/ANIMATION_SCROLL_MAP.md
../docs/RESPONSIVE_GUIDE.md
```

## Notes

- No backend.
- No database.
- No `node_modules` in handoff or GitHub commits.
- Mobile breakpoint is 720px.
- Desktop and mobile behaviors are intentionally different.
