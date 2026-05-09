# Financial Advisor App Foundation

Production-ready starter for a beginner paper trading stock game app:
- Basic paper trading capabilities
- Portfolio and transactions APIs
- Local Ollama-powered AI chat assistant
- Security-first backend patterns
- Mobile-friendly frontend dashboard

## Stack
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Quote service: FastAPI + Python
- Database: PostgreSQL via Prisma
- Auth: JWT access token flow
- AI: Local Ollama REST API

## Project Structure

```txt
.
|-- frontend/                # Next.js app (dashboard, charts, leaderboard)
|-- backend/                 # Express API (auth, trades, accounts, leaderboard)
|-- python-quote-service/    # FastAPI quote and history service
`-- shared/                  # Shared TypeScript types
```

## Quick Start

1. Install dependencies
   - `npm install`
2. Configure environment variables
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.local.example` to `frontend/.env.local`
3. Ensure Ollama is running locally if you want live AI responses:
   - `ollama serve`
4. Set up Python quote service dependencies:
   - `pip install -r python-quote-service/requirements.txt`
5. Run dev servers:
   - `npm run dev`
6. Run all services in one command:
   - `npm run start:services`
7. Run live quote service only:
   - `npm run dev:quotes`

## Live Quote Provider
- Primary: Alpha Vantage if `ALPHA_VANTAGE_API_KEY` is set
- Fallback: yfinance if no API key is available
- Backend uses `http://127.0.0.1:8001` locally and `http://trillium-quotes.internal:8001` in Fly
- If both providers fail, paper trading falls back to synthetic prices so orders still work

## Deployment
- The app now deploys as three Fly services:
  - `frontend/` -> `trilliumfinance`
  - `backend/` -> `trillium-backend`
  - `python-quote-service/` -> `trillium-quotes`
- The local three-service runner is `scripts/start-fly.mjs`, exposed as `npm run start:services`
- The frontend talks to the backend through same-origin `/api/*` routes in production
- The backend talks to the quote service through Fly internal DNS
- The backend accepts browser traffic from the public frontend URL and internal Fly hostnames
- The service-specific `fly.toml` files are the deployment configs to use
- The Dockerfiles expect the monorepo root as the build context so the shared workspace stays available
- A safe deployment pattern is to run Fly commands from the repo root and point at the service config, for example `fly deploy -c frontend/fly.toml`
- Exact deploy commands:
  - `fly deploy -c frontend/fly.toml`
  - `fly deploy -c backend/fly.toml`
  - `fly deploy -c python-quote-service/fly.toml`
- Before deploying, set secrets for `DATABASE_URL`, `CRON_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and any AI provider keys you use
- Email verification and bi-weekly digests are wired through Resend when the email secrets are present
- The weekly digest cron lives in `backend/src/routes/cron.ts` and requires `CRON_SECRET`
- The frontend health route checks the backend with a short timeout so you can spot backend outages quickly
- The frontend standalone image serves from `/app/frontend/server.js`, which matches the current Dockerfile layout
- The backend image installs the SSL libraries Prisma expects and the Prisma schema includes both Debian OpenSSL targets so deploys work on Fly's Bookworm base image
- If the backend still fails after the SSL fix, make sure `DATABASE_URL` is set as a Fly secret for `trillium-backend`

## Notes
- The supported quote symbols live in `python-quote-service/quote_service.py`
- AI responses include safety guardrails to avoid personalized financial advice
- New signups receive one of three starter portfolios: Conservative, Standard, or Aggressive
