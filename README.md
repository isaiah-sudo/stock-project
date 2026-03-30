Gamified Stock Simulator App
A modern, educational, game‑style stock‑trading simulator where users learn investing by playing.
Features include:

Virtual trading with $10,000 starting balance

Hundreds of stocks available for simulated investing

Leaderboards ranked by total portfolio value

Persistent user accounts with saved portfolios and trade history

Optional local AI assistant powered by Ollama for explanations and learning

Clean, mobile‑friendly dashboard designed for clarity and volatility visualization

Stack
Frontend
Next.js

TypeScript

Tailwind CSS

Backend
Node.js

Express

TypeScript

JWT authentication

Prisma ORM

PostgreSQL database

AI (Optional)
Local Ollama REST API for educational explanations
(e.g., “What is a limit order?”, “Why did my portfolio drop today?”)

Live Market Data
Python quote service (Alpha Vantage + yfinance fallback)

Project Structure
Code
.
├─ frontend/                # Next.js app (dashboard, charts, leaderboard)
├─ backend/                 # Express API (auth, trades, accounts, leaderboard)
└─ shared/                  # Shared TypeScript types
Quick Start
Install dependencies
Code
npm install
Environment variables
Copy and configure:

Code
backend/.env.example → backend/.env
frontend/.env.local.example → frontend/.env.local
Optional: Enable AI assistant
Code
ollama serve
Python quote service
Code
pip install -r python-quote-service/requirements.txt
Run development servers
Code
npm run dev
Run all services together
Code
npm run start:all
Run quote service
Code
npm run dev:quotes
Gameplay Features
1. Virtual Trading
Every new account starts with $10,000

Buy and sell from a large list of stocks

Real‑time or fallback synthetic pricing

Portfolio value updates dynamically

2. Leaderboard
Ranks users by total portfolio value

Updates automatically as trades happen

Encourages competition and learning

3. Persistent Accounts
JWT‑based auth

Saved portfolio, trades, and balance

Works across devices

4. Educational AI Assistant
Explains market concepts

Helps users understand volatility

Never gives personalized financial advice

Notes
Brokerage integration removed in favor of a pure simulation model

Backend and frontend updated to support gamification features

AI assistant includes safety guardrails

Synthetic prices ensure the game always works even if APIs fail
