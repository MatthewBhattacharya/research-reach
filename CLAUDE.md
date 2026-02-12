# Research Reach

Desktop app to help students cold-email professors about research opportunities.

## Tech Stack
- Electron + electron-vite
- React 18 + TypeScript + TailwindCSS
- SQLite (better-sqlite3 + drizzle-orm)
- Zustand for state management
- TipTap for rich text editing
- Cheerio for web scraping
- Anthropic/OpenAI SDKs for AI features

## Running
```bash
npm install
npm run dev      # development
npm run build    # production build
```

## Architecture
- `src/main/` - Electron main process (DB, IPC handlers, scrapers, AI services)
- `src/preload/` - Context bridge exposing API to renderer
- `src/renderer/` - React UI (pages, components, stores)
- DB stored at Electron userData path (~/.config/research-reach/research-reach.db)

## Key Conventions
- IPC channels follow `domain:action` pattern (e.g. `professor:save`, `ai:generateEmail`)
- Stores are Zustand with async actions that call `window.api.*`
- Scrapers use cheerio + fetch (no puppeteer for now)
- Paper search uses Semantic Scholar API first, Google Scholar as fallback
- WSL-aware: external URLs open via cmd.exe on WSL

## Known Issues
- Google Scholar aggressively rate-limits; Semantic Scholar is more reliable
- Professor email extraction uses scoring heuristic — may miss emails not on profile page
