# FairHour

FairHour is a full-stack time banking platform where users exchange skills using time credits instead of money.

It includes:

- Skill-based credit valuation (NCO classification + reputation + demand + trust factors)
- Exchange lifecycle with dual confirmation
- Optional blockchain transaction logging to Sepolia
- Realtime messaging tied to active exchanges

---

## Current Architecture

```
fairhour/
├── client/       # React + Vite + TypeScript frontend
├── server/       # Express + Prisma + PostgreSQL API + Socket.IO
└── blockchain/   # Hardhat + Solidity (TimeBankLedger contract)
```

### Client (React)

- Auth, onboarding, profile, service browsing, requests, exchanges/activity, and messaging UI
- Wallet connection from profile (MetaMask via ethers)
- Valuation preview on service details

### Server (Express + Prisma)

- JWT auth, onboarding/profile management, services, requests, exchanges, reviews
- Occupation catalog and valuation estimate APIs
- Exchange completion triggers credit valuation and optional blockchain receipt logging
- Socket.IO realtime chat with read status and rate limiting

### Blockchain (Hardhat + Solidity)

- `TimeBankLedger.sol` records service transactions and maintains provider/receiver balances
- Deployment script outputs contract address for server integration

---

## Skill Valuation (Implemented)

Credits are computed when an exchange moves to `COMPLETED`:

`credits = hours × skill_multiplier × reputation_factor × demand_factor`

With additional trust dampening for new providers and clamped total multiplier bounds.

Data sources:

- `Occupation` (NCO code, skill level, base multiplier)
- `Review` history (average rating)
- `ServiceStats` (demand ratio)
- Provider completion track record (trust factor)

Valuation endpoints:

- `GET /api/valuation/estimate` (public preview)

---

## Blockchain Integration (Implemented)

When both parties confirm an active exchange:

1. Exchange is completed and credits are calculated.
2. Server attempts to write the transaction on-chain through `blockchainService`.
3. On success, `blockchainTxHash` is saved on the exchange.
4. If chain logging fails, exchange remains completed off-chain (non-blocking fallback).

Requirements for on-chain logging:

- Provider and requester must both have `walletAddress` set.
- Server must have `SEPOLIA_RPC`, `PRIVATE_KEY`, and `CONTRACT_ADDRESS` configured.

---

## Core Features

- Authentication: register/login with JWT
- Onboarding flow with skills, bio, availability, avatar
- Profile updates including wallet connection
- Service marketplace (CRUD, occupation tagging)
- Public requests board and request management
- Exchange lifecycle: pending → active → completed/rejected
- Dual confirmation and conversation lock after completion
- Realtime chat per exchange (Socket.IO)
- Reviews for completed exchanges
- Time balance and activity history

---

## API Modules

Base URL: `http://localhost:5000/api` (unless overridden)

- `/auth` - register/login
- `/users` - profile, onboarding, balance
- `/services` - service CRUD + browse
- `/requests` - service requests
- `/exchanges` - request service, activate/reject/confirm, my exchanges
- `/conversations` - conversation list/messages/read
- `/occupations` - NCO catalog/search/groups
- `/reviews` - create and fetch provider reviews
- `/valuation` - credit estimation preview

Health:

- `GET /health`
- `GET /api/health`

---

## Prerequisites

- Node.js >= 18
- PostgreSQL database
- MetaMask (optional, for wallet linking)
- Sepolia RPC + funded deployer wallet (optional, for blockchain logging)

---

## Setup

### 1) Install dependencies

From project root:

```bash
npm run install:all
```

Install blockchain dependencies separately:

```bash
cd blockchain
npm install
```

### 2) Configure environment files

#### Server (`server/.env`)

```env
# Required
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fairhour"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fairhour"
JWT_SECRET="replace-with-strong-secret"

# Optional (defaults shown)
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
SOCKET_PATH="/socket.io"
REDIS_URL=""

# Blockchain integration (optional)
SEPOLIA_RPC=""
PRIVATE_KEY=""
CONTRACT_ADDRESS=""
```

#### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_SOCKET_PATH=/socket.io

# Optional (currently passed by vite config)
GEMINI_API_KEY=
```

### 3) Prepare database

From root:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Optional: seed occupation data

```bash
cd server
npm run seed
```

### 4) Run app in development

From root:

```bash
npm run dev
```

This starts:

- Client: `http://localhost:3000`
- Server: `http://localhost:5000`

---

## Blockchain Deployment (Optional)

Deploy contract from `blockchain/`:

```bash
cd blockchain
npm run compile
npm run deploy
```

Copy deployed address into `server/.env` as `CONTRACT_ADDRESS`.

---

## Useful Scripts

### Root

| Script                    | Description                  |
| ------------------------- | ---------------------------- |
| `npm run dev`             | Run client + server together |
| `npm run dev:client`      | Run frontend only            |
| `npm run dev:server`      | Run backend only             |
| `npm run build`           | Build client + server        |
| `npm run install:all`     | Install client + server deps |
| `npm run prisma:generate` | Generate Prisma client       |
| `npm run prisma:migrate`  | Run Prisma migrations        |
| `npm run prisma:studio`   | Open Prisma Studio           |

### Client (`client/`)

| Script          | Description           |
| --------------- | --------------------- |
| `npm run dev`   | Start Vite dev server |
| `npm run build` | Build frontend        |
| `npm run lint`  | Lint client code      |

### Server (`server/`)

| Script          | Description               |
| --------------- | ------------------------- |
| `npm run dev`   | Start API with hot reload |
| `npm run build` | Compile TypeScript        |
| `npm start`     | Run compiled server       |
| `npm run seed`  | Seed occupations/stats    |

### Blockchain (`blockchain/`)

| Script            | Description                        |
| ----------------- | ---------------------------------- |
| `npm run compile` | Compile smart contracts            |
| `npm run deploy`  | Deploy `TimeBankLedger` to Sepolia |

---

## Notes

- Never commit real secrets in `.env` files.
- Blockchain logging is intentionally non-blocking; core platform flow continues if chain write fails.
- Conversations are locked when an exchange is fully completed.

## License

MIT
