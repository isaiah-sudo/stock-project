# Financial Advisor App Foundation

Production-ready starter for a beginner paper trading stock game app:
- Basic paper trading capabilities
- Portfolio + transactions APIs
- Local Ollama-powered AI chat assistant
- Security-first backend patterns
- Mobile-friendly frontend dashboard

## Stack
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma
- Auth: JWT (access token flow)
- AI: Local Ollama REST API

## Project Structure

```txt
.
├─ frontend/                # Next.js app (dashboard, charts, leaderboard)
├─ backend/                 # Express API (auth, trades, accounts, leaderboard)
└─ shared/                  # Shared TypeScript types
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
   - `npm run start:all`
7. Run live quote service (Python):
   - `npm run dev:quotes`

## Live Quote Provider
- **Primary:** Alpha Vantage (if `ALPHA_VANTAGE_API_KEY` is set in your environment)
- **Fallback:** yfinance (no API key required)
- Backend uses `http://127.0.0.1:8001` to fetch quotes.
- If both providers fail, paper trading falls back to synthetic prices so orders still work.

## Deployment
- The backend now reads its allowed browser origins from `FRONTEND_URL`, `PUBLIC_APP_URL`, or `CORS_ORIGINS`.
- For Fly.io, set `DATABASE_URL`, `FRONTEND_URL`, `PUBLIC_APP_URL`, `APP_BASE_URL`, and `CRON_SECRET` in the app secrets.
- For Vercel, point `NEXT_PUBLIC_API_BASE_URL` at the deployed backend URL and keep the backend on Fly or another Node host.
- Email verification and bi-weekly digests are wired through Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are present.

## Fly.io
- The repo now includes a root `Dockerfile` and `fly.toml` so the app can run as one Fly service.
- The Next.js frontend proxies `/api/*` to the backend on `127.0.0.1:4000`, so the browser can stay on the same origin.
- The backend listens in container deployments and the Python quote service runs inside the same machine on port `8001`.
- Before deploying, set the Fly secrets for at least `DATABASE_URL`, `CRON_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and any AI provider keys you use.
- The public URLs are already set in `fly.toml` to `https://trilliumfinance.fly.dev` for `FRONTEND_URL`, `PUBLIC_APP_URL`, and `APP_BASE_URL`.
- The app already sends verification emails after signup in `backend/src/routes/auth.ts`.
- The weekly digest cron lives in `backend/src/routes/cron.ts` and requires `CRON_SECRET` to be set as a Fly secret.
- The email helper in `backend/src/services/emailService.ts` uses Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are present, and safely skips delivery when they are missing.
- If you want to wire Fly secrets in one shot, use a command like:
  - `fly secrets set DATABASE_URL=... CRON_SECRET=... JWT_SECRET=... RESEND_API_KEY=... RESEND_FROM_EMAIL=... -a trilliumfinance`
- Because you pasted an API key in chat, rotate it in Resend before using it in production.

## Notes
- Some stocks are included in the paper trade but to add more you need to add them to the `python-quote-service/stocks.txt` file.
- AI responses include safety guardrails to avoid personalized financial advice.
- New signups receive one of three starter portfolios: Conservative, Standard, or Aggressive.
