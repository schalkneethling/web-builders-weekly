# Web Builders Weekly Crossword

A weekly crossword for web developers, themed around the web platform. Play in the browser with keyboard-friendly navigation, local progress saving, and spoiler-free score sharing.

**Live site:** [crossword.schalkneethling.com](https://crossword.schalkneethling.com)

## Features

- **Weekly puzzles** published on a fixed schedule (UTC calendar dates)
- **Keyboard-first play** with across/down navigation, check, and reveal
- **Progress persistence** in `localStorage`, with a notice when storage is unavailable
- **Light, dark, and system themes**
- **Completion recap** with optional confetti and shareable results
- **Puzzle archive** for past published puzzles
- **Accessible UI** built with semantic HTML, visually hidden labels, and native platform APIs (Popover API, logical CSS)

## Tech stack

| Layer           | Tools                                                            |
| --------------- | ---------------------------------------------------------------- |
| UI              | React 19, TypeScript                                             |
| Build & test    | [Vite+](https://viteplus.dev/) (`vp` CLI), Vitest                |
| Package manager | Bun                                                              |
| Linting         | Oxlint, Oxfmt, Stylelint (with logical CSS and baseline plugins) |

## Getting started

**Prerequisites:** [Bun](https://bun.sh/) 1.3+ and the Vite+ CLI (`vp`).

```bash
vp install
vp dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Common commands

| Command                   | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `vp dev`                  | Start the development server                     |
| `vp build`                | Type-check and build for production              |
| `vp preview`              | Preview the production build locally             |
| `vp check`                | Format, lint, and type-check                     |
| `vp test`                 | Run unit tests                                   |
| `bun run validate-puzzle` | Validate puzzle JSON against grid and clue rules |
| `bun run quality`         | CSS lint + puzzle validation                     |
| `bun run doctor`          | React Doctor diagnostics                         |

Run `vp install` after pulling changes that update dependencies.

## Project layout

```
public/
  puzzles/              Puzzle index and JSON files
  crossword-social-share.png
  favicon.*, site.webmanifest
src/
  components/           UI (grid, clues, toolbar, sharing, etc.)
  hooks/                Puzzle state, theme, clue highlighting
  utils/                Grid helpers, storage, scheduling, validation
  types/puzzle.ts       Puzzle data model
scripts/
  validate-puzzle.mjs   Puzzle integrity checks
tests/unit/             Unit tests
index.html              App shell, meta tags, theme bootstrap
```

## How puzzles work

Puzzles are static JSON served from `public/puzzles/`.

### Index

`public/puzzles/index.json` lists every puzzle and points to the current edition:

```json
{
  "latest": "2026-07-03",
  "puzzles": [
    {
      "id": "2026-07-03",
      "date": "2026-07-03",
      "theme": "Web Platform Friday"
    }
  ]
}
```

- **`id`** — filename without extension (`2026-07-03.json`)
- **`date`** — publish date in `YYYY-MM-DD` (UTC)
- **`latest`** — editorial pointer to the current puzzle

### Puzzle file

Each puzzle is `public/puzzles/{id}.json` with this shape:

- `id`, `date`, `theme`
- `size.rows` / `size.cols`
- `grid` — letter cells (`answer`, optional `clueNumber`) and blocked cells
- `clues.across` / `clues.down` — numbered clues with grid coordinates and answers

Run `bun run validate-puzzle` before committing puzzle changes. The script checks index alignment, grid dimensions, clue numbering, and that clue answers match the grid.

### Publishing schedule

By default, the app loads the newest puzzle whose `date` is on or before today (UTC). Future-dated puzzles stay hidden until their release day.

- **Preview before launch:** `?puzzle=2026-07-03`
- **Past puzzles:** listed in the archive once published

## Adding a new puzzle

1. Create `public/puzzles/YYYY-MM-DD.json` following the schema above.
2. Add an entry to `public/puzzles/index.json` and set `latest`.
3. Run `bun run validate-puzzle`, then `vp check` and `vp test`.
4. Deploy — the puzzle goes live automatically on its UTC date.

## Deployment

Build a static site with:

```bash
vp build
```

Output goes to `dist/`. Deploy that folder to any static host. The production URL is configured in `index.html` for Open Graph, Twitter cards, and the canonical link.

## License

[MIT](LICENSE)
