# Gold Ratio Analytics

Next.js app for tracking **precious metals & macro ratios** (tickers + ratio lab).

## Features

- Live-ish quotes + history (with caching)
- Ratio charts + stats (min/max/median/mean/std/percentile/z-score)
- Optional FRED integration for macro series (requires your API key)

## Quickstart

```bash
npm install
cp .env.local.example .env.local   # optional
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000` (or `http://localhost:3000`).

If port `3000` is busy, use another port (example `3001`):

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

## Environment variables

Copy `.env.local.example` → `.env.local`.

- `FRED_API_KEY` (optional): enables FRED-only instruments/ratios.
  - Get a free key here: `https://fred.stlouisfed.org/docs/api/api_key.html`
  - You can also paste the key in the app Settings UI (stored in `localStorage`, not in the repo).
- `MSN_ONE_SERVICE_API_KEY` (optional): override MSN Finance OneService key.
- `MSN_ONE_SERVICE_OCID` (optional): default `Peregrine`.
- `MSN_ONE_SERVICE_MARKET` (optional): default `en-us`.
- `BINANCE_API_BASE_URL` (optional): default `https://api.binance.com` (use `https://api.binance.us` if needed and the symbol exists).

## Git safety (don’t leak keys)

- `.env.local` and `*.local` env files are ignored by git (see `.gitignore`).
- Keys entered via UI are stored in your browser `localStorage` only.

## Data sources (notes)

- **MSN/Bing Finance**: primary for autosuggest/quotes/charts.
- **Yahoo Finance**: fallback (can rate-limit with HTTP 429).
- **FRED**: macro series (requires API key).
- **Binance**: crypto/commodity-token proxies (used for `PAXG` via `PAXGUSDT`).

Some instruments may use practical **proxies** depending on what the provider can resolve.

## Project structure

- `src/config/universe.ts`: instrument list + provider priority (`msnQuery` overrides)
- `src/config/ratios.ts`: ratio definitions (divide/multiply + optional index-to-window)
- `src/app/api/*`: server routes (`/api/quotes`, `/api/history`, `/api/ratio`)
- `src/lib/providers/*`: data providers (MSN/Yahoo/Binance/FRED/mock)
- `src/lib/series/align.ts`: daily fill, alignment, ratio computation
- `src/lib/math/stats.ts`: stats used by the ratio panel

## Disclaimer

This project is for educational purposes only and is **not financial advice**.
