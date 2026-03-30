📈 Gamified Stock Simulator App
A modern, educational, game‑style stock‑trading simulator where users learn investing by playing.
This app focuses on fun, competition, and learning through volatility, with a clean UI and a realistic‑feeling trading loop.

🎮 Core Features
💰 Virtual Trading
Every new user starts with $10,000 virtual cash

Buy and sell from hundreds of stocks

Real‑time or fallback synthetic pricing

Portfolio value updates dynamically

Designed to show volatility clearly so users learn how markets move

🏆 Leaderboard
Ranks users by total portfolio value

Updates automatically as trades happen

Encourages friendly competition and long‑term strategy

👤 Persistent Accounts
JWT‑based authentication

Saved portfolios, trades, and balances

Works across devices

Secure backend patterns to protect user data

🤖 Educational AI Assistant (Optional)
Powered by local Ollama

Explains market concepts in simple language

Helps users understand volatility, risk, and order types

Never gives personalized financial advice

🧱 Tech Stack
Frontend
Next.js

TypeScript

Tailwind CSS

Backend
Node.js

Express

TypeScript

Prisma ORM

PostgreSQL

AI (Optional)
Local Ollama REST API for educational explanations

Live Market Data
Python quote service

Alpha Vantage + yfinance fallback

Synthetic pricing when APIs fail (ensures the game always works)

📁 Project Structure
Code
.
├─ frontend/                # Next.js app (dashboard, charts, leaderboard)
├─ backend/                 # Express API (auth, trades, accounts, leaderboard)
└─ shared/                  # Shared TypeScript types
⚡ Quick Start
1. Install dependencies
Code
npm install
2. Configure environment variables
Code
backend/.env.example → backend/.env
frontend/.env.local.example → frontend/.env.local
3. (Optional) Enable AI assistant
Code
ollama serve
4. Install Python quote service dependencies
Code
pip install -r python-quote-service/requirements.txt
5. Run development servers
Code
npm run dev
6. Run all services together
Code
npm run start:all
7. Run quote service
Code
npm run dev:quotes
📚 Notes
Brokerage integration removed in favor of a pure simulation model

Backend and frontend updated to support gamification features

AI assistant includes safety guardrails

Synthetic prices ensure the game always works even if APIs fail

Designed to be educational, not financial advice