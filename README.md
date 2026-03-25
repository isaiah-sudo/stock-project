# Financial Advisor App Foundation

Production-ready starter for a modern financial advisor web app with:
- OAuth-ready brokerage linking (Webull placeholder)
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
├─ frontend/                # Next.js app
├─ backend/                 # Express API
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
- Backend uses `STOCK_QUOTE_SERVICE_URL` (default `http://127.0.0.1:8001`) to fetch quotes.
- If both providers fail, paper trading falls back to synthetic prices so orders still work.

## Notes
- Brokerage integration files are scaffolded with placeholder Webull OAuth methods.
- Mock data is included for local development when brokerage data is unavailable.
- AI responses include safety guardrails to avoid personalized financial advice.
