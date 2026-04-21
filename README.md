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

## Notes
- Some stocks are included in the paper trade but to add more you need to add them to the `python-quote-service/stocks.txt` file.
- AI responses include safety guardrails to avoid personalized financial advice.
