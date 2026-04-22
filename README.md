# FairHour
FairHour is a full-stack time-banking platform that lets people trade skills for time credits instead of money, with clearer trust signals, fairer credit rates, and optional blockchain receipts.

## Table of Contents
- [Setup / Installation](#setup--installation)
- [Usage Examples](#usage-examples)
- [Architecture / How It Works](#architecture--how-it-works)
- [API / Config Reference](#api--config-reference)
- [Contributing](#contributing)
- [License](#license)

## Setup / Installation
If you only want to use FairHour and someone else is already hosting it, you do not need this section. Open the frontend URL they give you and skip to [Usage Examples](#usage-examples).

If you want to run the project locally or contribute code, this repository contains three parts:

- `client/`: React + Vite frontend
- `server/`: Express + Prisma + PostgreSQL API with Socket.IO
- `blockchain/`: Hardhat + Solidity contract for optional on-chain receipts

### Prerequisites

| Requirement | Needed for | Notes |
| --- | --- | --- |
| Node.js 18+ | Everything | The server declares `>=18.0.0`. |
| npm | Everything | Used by all three workspaces. |
| PostgreSQL | Server | Required for users, services, exchanges, reviews, occupations, and chat metadata. |
| MetaMask | Optional user feature | Only needed if you want to link a wallet from the profile page. |
| Sepolia RPC, funded wallet, contract address | Optional blockchain logging | Only needed if you want completed exchanges written to Ethereum Sepolia. |
| Redis | Optional scaling | Only needed if you want the Socket.IO Redis adapter. |

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

That installs the `client` and `server` workspaces.

If you also want to work on the smart contract, install the blockchain workspace separately:

```bash
cd blockchain
npm install
```

### 2. Create environment files

#### `server/.env`

Start from `server/.env.example`, then add the missing Prisma direct URL as well:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fairhour?schema=public"
DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:5432/fairhour?schema=public"
JWT_SECRET="replace-this-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
SOCKET_PATH="/socket.io"
CHAT_MESSAGE_MAX_LENGTH=2000
CHAT_RATE_LIMIT_WINDOW_MS=60000
CHAT_RATE_LIMIT_MAX=30
REDIS_URL=""

# Optional blockchain logging
SEPOLIA_RPC=""
PRIVATE_KEY=""
CONTRACT_ADDRESS=""
```

Important:

- `DATABASE_URL` is required.
- `DIRECT_DATABASE_URL` is also required by `server/prisma/schema.prisma`, but it is not present in `server/.env.example` right now. `[NEEDS CLARIFICATION]`
- In development, the code falls back to an insecure JWT secret if `JWT_SECRET` is missing. Do not rely on that outside local experiments.

#### `client/.env`

Start from `client/.env.example`:

```env
VITE_API_URL="http://localhost:5000"
VITE_SOCKET_URL="http://localhost:5000"
VITE_SOCKET_PATH="/socket.io"
```

Notes:

- The Vite config also exposes `GEMINI_API_KEY`, but there is no matching feature in the current source tree. `[NEEDS CLARIFICATION]`
- The frontend runs on port `3000` by default.

#### `blockchain/.env` (optional)

There is no checked-in example file in `blockchain/`, so create one manually if you plan to deploy the contract:

```env
SEPOLIA_RPC="https://sepolia.infura.io/v3/your-key"
PRIVATE_KEY="0xyourprivatekey"
ETHERSCAN_API_KEY=""
```

### 3. Prepare the database

Generate the Prisma client and run the migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Seed occupation data for valuation and credibility features:

```bash
cd server
npm run seed
```

What the seed does:

- imports occupation data from `server/prisma/nco-data.json`
- creates `Occupation` rows
- creates starter `ServiceStats` rows used by the valuation engine

### 4. Start the app in development

From the root:

```bash
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:3000`
- API: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- API health check: `http://localhost:5000/api/health`
- Socket.IO path: `http://localhost:5000/socket.io`

### 5. Build for production

From the root:

```bash
npm run build
```

This builds:

- the Vite frontend in `client/`
- the TypeScript server in `server/dist/`

### 6. Optional: deploy the smart contract

Compile and deploy from `blockchain/`:

```bash
cd blockchain
npm run compile
npm run deploy
```

After deployment, copy the printed contract address into `server/.env` as `CONTRACT_ADDRESS`.

### Common environment issues

- `PrismaClientInitializationError` during startup usually means PostgreSQL is not running, the credentials are wrong, or `DATABASE_URL` / `DIRECT_DATABASE_URL` is missing.
- `npm run install:all` does not install `blockchain/`. If contract commands fail, install that workspace separately.
- If the frontend cannot reach the API, check that `client/.env` points to port `5000` and `server/.env` allows `CORS_ORIGIN=http://localhost:3000`.
- If chat connects but messages fail, make sure `VITE_SOCKET_PATH` and `SOCKET_PATH` match.
- If blockchain logging never appears, that is expected unless `SEPOLIA_RPC`, `PRIVATE_KEY`, and `CONTRACT_ADDRESS` are all set on the server and both users have linked wallet addresses.
- If wallet linking fails in the browser, install MetaMask first. The rest of the app still works without it.
- If you are scaling Socket.IO across multiple server instances, set `REDIS_URL`. Without Redis, chat still works in a single-server setup.

## Usage Examples
This section includes both end-user flows and developer-facing API examples.

### Everyday browser use

The most common user journey looks like this:

1. Sign up and receive a 2-credit welcome bonus.
2. Complete onboarding by choosing skills, adding a short bio, and selecting availability.
3. Publish a service you can offer.
4. Browse other services or public requests.
5. Request a service and spend credits.
6. Start and finish the exchange using the two OTP handshakes.
7. Leave a review so the provider's credibility and future rate improve over time.

### Simple example: start the full app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Simple example: register and log in through the API

Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Asha Patel",
    "email": "asha@example.com",
    "password": "StrongPass123",
    "location": "Pune"
  }'
```

Log in:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "asha@example.com",
    "password": "StrongPass123"
  }'
```

Use the returned JWT as `Authorization: Bearer <TOKEN>` in protected requests.

### Simple example: create and browse services

Create a service:

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "Conversational English tutoring",
    "description": "I can help with spoken English practice, interview preparation, and pronunciation.",
    "category": "Language Lessons",
    "occupationId": null
  }'
```

Browse public services:

```bash
curl "http://localhost:5000/api/services?limit=10&offset=0"
```

Fetch one service in detail:

```bash
curl "http://localhost:5000/api/services/<SERVICE_ID>"
```

### Advanced example: estimate a fair credit rate before requesting a service

This endpoint is public and does not require login:

```bash
curl "http://localhost:5000/api/valuation/estimate?occupationId=<OCCUPATION_ID>&providerId=<PROVIDER_ID>&hours=2"
```

What it returns:

- estimated minimum and maximum credits for the full job
- estimated minimum and maximum credits per hour
- a breakdown of skill level, demand, reviews, and credibility multiplier

### Advanced example: complete a full exchange with OTP verification

Step 1: requester sends a service request:

```bash
curl -X POST http://localhost:5000/api/exchanges/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <REQUESTER_TOKEN>" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "hours": 2
  }'
```

Step 2: provider accepts the request and receives a start OTP:

```bash
curl -X PUT http://localhost:5000/api/exchanges/<EXCHANGE_ID>/activate \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

Step 3: requester verifies the start OTP to move the exchange from `ACCEPTED` to `ACTIVE`:

```bash
curl -X POST http://localhost:5000/api/exchanges/<EXCHANGE_ID>/otp/start/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <REQUESTER_TOKEN>" \
  -d '{
    "otp": "123456"
  }'
```

Step 4: requester generates the completion OTP:

```bash
curl -X POST http://localhost:5000/api/exchanges/<EXCHANGE_ID>/otp/complete/generate \
  -H "Authorization: Bearer <REQUESTER_TOKEN>"
```

Step 5: provider verifies the completion OTP to finish the exchange:

```bash
curl -X POST http://localhost:5000/api/exchanges/<EXCHANGE_ID>/otp/complete/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -d '{
    "otp": "654321"
  }'
```

After step 5:

- the exchange status becomes `COMPLETED`
- credits are calculated by the valuation engine
- the provider's credibility history is updated
- chat for that exchange is locked
- the server tries to write a receipt to Sepolia if blockchain settings are present

Step 6: requester leaves a review:

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <REQUESTER_TOKEN>" \
  -d '{
    "exchangeId": "<EXCHANGE_ID>",
    "rating": 5,
    "comment": "Clear, punctual, and very helpful."
  }'
```

### Advanced example: add proof for a skill and let the community vote on it

Set your declared experience level:

```bash
curl -X PUT http://localhost:5000/api/users/me/experience/<OCCUPATION_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "declaredLevel": "intermediate"
  }'
```

Upload a proof link:

```bash
curl -X POST http://localhost:5000/api/proofs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "occupationId": "<OCCUPATION_ID>",
    "proofType": "portfolio",
    "proofUrl": "https://example.com/portfolio",
    "description": "Recent work samples for this skill.",
    "declaredLevel": "intermediate"
  }'
```

Another user votes on that proof:

```bash
curl -X POST http://localhost:5000/api/proofs/<PROOF_ID>/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANOTHER_USER_TOKEN>" \
  -d '{
    "voteType": "valid"
  }'
```

### Advanced example: read messages for an exchange conversation

List conversations:

```bash
curl http://localhost:5000/api/conversations \
  -H "Authorization: Bearer <TOKEN>"
```

Read messages from one conversation:

```bash
curl "http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages?limit=50&offset=0" \
  -H "Authorization: Bearer <TOKEN>"
```

Mark them as read:

```bash
curl -X POST http://localhost:5000/api/conversations/<CONVERSATION_ID>/read \
  -H "Authorization: Bearer <TOKEN>"
```

## Architecture / How It Works
At a high level, FairHour is a browser app that talks to an Express API. The API stores state in PostgreSQL through Prisma, pushes chat updates over Socket.IO, and can optionally record completed exchanges on Ethereum Sepolia.

```text
React client
  |-- HTTP requests --> Express API
  |-- Socket.IO ------> Realtime chat server

Express API
  |-- Prisma ---------> PostgreSQL
  |-- Optional ethers -> TimeBankLedger smart contract on Sepolia
```

### Main parts

| Part | What it does |
| --- | --- |
| `client/` | Handles sign-up, onboarding, browsing, profile editing, requests, exchanges, reviews, wallet linking, and chat UI. |
| `server/` | Exposes REST endpoints, checks auth, validates input, calculates credits, manages OTP-based exchange flow, and serves chat over Socket.IO. |
| PostgreSQL | Stores users, services, requests, exchanges, reviews, occupations, proof votes, chat messages, and credibility events. |
| `blockchain/` | Contains the `TimeBankLedger` contract and Hardhat deployment scripts. |

### Important domain concepts

| Concept | Meaning in FairHour |
| --- | --- |
| Service | An offer made by a user, such as tutoring or gardening. |
| Request | A public post asking for help in a category. |
| Exchange | A time-credit transaction between provider and requester. |
| Occupation | An NCO-based skill classification used for valuation and credibility. |
| Credibility | A score derived from completed jobs, reviews, repeat clients, disputes, declared level, and verified proofs. |
| OTP phases | Two short code checks: one to start the service, one to finish it. |

### Exchange lifecycle

1. A requester spends credits to request a service.
2. The provider accepts, which creates or reuses a conversation and starts the first OTP phase.
3. The requester verifies the start OTP, which marks the exchange `ACTIVE`.
4. The requester later generates the completion OTP.
5. The provider verifies that OTP, which marks the exchange `COMPLETED`.
6. The server calculates earned credits and stores a valuation breakdown.
7. If wallet and Sepolia settings are available, the server writes a receipt on-chain.
8. The conversation is locked so the exchange history stays fixed after completion.

### Credit valuation in plain English

The server does not always use a flat 1:1 hours-to-credits rule. It can increase or cap credits using:

- skill level from the linked occupation
- provider reputation from reviews
- demand for that occupation
- credibility and experience for that specific occupation

In simplified form:

```text
credits = hours × skill multiplier × reputation factor × demand factor × experience multiplier
```

The server also applies tiered caps so the multiplier cannot grow without limit.

## API / Config Reference
Base API URL in local development:

```text
http://localhost:5000/api
```

### Common API behavior

Most HTTP responses follow this shape:

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {}
}
```

Protected endpoints expect:

```text
Authorization: Bearer <JWT>
```

### Health endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | No | none | Root health check for the server process. |
| `GET` | `/api/health` | No | none | API-prefixed health check. |

### Authentication endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | `body.name: string (2-100)`, `body.email: email`, `body.password: string (8-128)`, `body.location?: string (max 200)` | Creates a user, issues a JWT, and adds a 2-credit signup bonus. |
| `POST` | `/api/auth/login` | No | `body.email: email`, `body.password: string` | Signs in and returns a JWT. |

### User and profile endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/users/me` | Yes | none | Returns the current user's profile and counts for services, requests, and exchanges. |
| `PATCH` | `/api/users/profile` | Yes | `body.name?: string`, `body.location?: string|null`, `body.bio?: string|null`, `body.skills?: string[]`, `body.availability?: string[]`, `body.profileImageUrl?: string|null`, `body.walletAddress?: string|null` | Partially updates profile data. |
| `GET` | `/api/users/me/balance` | Yes | none | Returns `balance`, `hoursEarned`, and `hoursSpent`. |
| `POST` | `/api/users/onboarding/complete` | Yes | `body.skills: string[]`, `body.availability: string[]`, `body.bio?: string`, `body.profileImageUrl?: string` | Marks onboarding complete and fills the user's starter profile. |
| `PUT` | `/api/users/me/experience/:occupationId` | Yes | `body.declaredLevel: "beginner" | "intermediate" | "expert"` | Sets the authenticated user's declared experience level for one occupation. |
| `GET` | `/api/users/:id/experience/:occupationId` | No | `path.id: string`, `path.occupationId: string` | Returns full credibility details for one user and one occupation. |
| `GET` | `/api/users/:id/credibility` | No | `path.id: string` | Returns the user's credibility summary across occupations. |

### Service endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/services` | No | `query.category?: string`, `query.isActive?: boolean = true`, `query.limit?: number = 20`, `query.offset?: number = 0` | Lists services. By default, only active services are returned. |
| `GET` | `/api/services/:id` | No | `path.id: string` | Returns one service plus provider details and occupation metadata. |
| `GET` | `/api/services/me` | Yes | none | Lists the authenticated user's services. |
| `POST` | `/api/services` | Yes | `body.title: string (3-200)`, `body.description: string (10-2000)`, `body.category: string (1-100)`, `body.occupationId?: uuid|null = null` | Creates a service. |
| `PUT` | `/api/services/:id` | Yes | `body.title?: string`, `body.description?: string`, `body.category?: string`, `body.isActive?: boolean`, `body.occupationId?: uuid|null` | Updates a service owned by the current user. |
| `DELETE` | `/api/services/:id` | Yes | `path.id: string` | Deletes a service owned by the current user. |

### Request board endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/requests` | No | `query.serviceCategory?: string`, `query.limit?: number = 20`, `query.offset?: number = 0` | Lists public requests. Only `OPEN` requests are returned. |
| `POST` | `/api/requests` | Yes | `body.title: string (5-100)`, `body.serviceCategory: string (1-100)`, `body.description: string (10-2000)`, `body.hours: number = 1, min 0.5, max 20` | Creates a new public request. |
| `GET` | `/api/requests/me` | Yes | `query.status?: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"`, `query.serviceCategory?: string`, `query.limit?: number = 20`, `query.offset?: number = 0` | Intended to list the current user's requests, but the controller only filters by owner when `mine=true` is passed. `[NEEDS CLARIFICATION]` |
| `PUT` | `/api/requests/:id/status` | Yes | `body.status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"` | Lets the owner update status, or lets another user mark an `OPEN` request as `IN_PROGRESS` when offering help. |

### Exchange endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/exchanges/request` | Yes | `body.serviceId: uuid`, `body.hours: number`, `body.message?: string` | Creates a requester-initiated exchange for a service after checking available balance. The `message` field is typed in the controller but not persisted anywhere. `[NEEDS CLARIFICATION]` |
| `POST` | `/api/exchanges` | Yes | `body.requesterId: uuid`, `body.serviceId?: uuid`, `body.hours: number > 0, max 100` | Creates a provider-initiated exchange. |
| `GET` | `/api/exchanges/me` | Yes | `query.role?: "provider" | "requester"`, `query.status?: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED"`, `query.limit?: number = 20`, `query.offset?: number = 0` | Lists exchanges involving the authenticated user. |
| `PUT` | `/api/exchanges/:id/activate` | Yes | `path.id: string` | Provider accepts a pending exchange, ensures a conversation exists, and generates the start OTP. |
| `GET` | `/api/exchanges/:id/otp/status` | Yes | `path.id: string` | Returns the state of both OTP phases, including remaining attempts. |
| `POST` | `/api/exchanges/:id/otp/start/generate` | Yes | `path.id: string` | Provider generates the start OTP. TTL is 5 minutes; max generation attempts per phase: 3. |
| `POST` | `/api/exchanges/:id/otp/start/verify` | Yes | `body.otp: string (6 digits)` | Requester verifies the start OTP and moves the exchange to `ACTIVE`. |
| `POST` | `/api/exchanges/:id/otp/complete/generate` | Yes | `path.id: string` | Requester generates the completion OTP. |
| `POST` | `/api/exchanges/:id/otp/complete/verify` | Yes | `body.otp: string (6 digits)` | Provider verifies the completion OTP and completes the exchange. |
| `PUT` | `/api/exchanges/:id/reject` | Yes | `body.reason?: string` | Provider rejects a pending request, or requester cancels it. |
| `PUT` | `/api/exchanges/:id/confirm` | Yes | none | Deprecated endpoint. The controller now returns HTTP `410` and tells callers to use the OTP flow instead. |

### Conversation and chat endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/conversations` | Yes | none | Lists the authenticated user's conversations, last message, unread count, and exchange summary. |
| `GET` | `/api/conversations/:id/messages` | Yes | `query.limit?: number = 50, max 100`, `query.offset?: number = 0` | Returns paginated message history for one conversation. |
| `POST` | `/api/conversations/:id/read` | Yes | none | Marks unread messages from the other participant as read. |

### Occupation endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/occupations/groups` | No | none | Returns distinct occupation major groups. |
| `GET` | `/api/occupations` | No | `query.search?: string`, `query.majorGroup?: string`, `query.skillLevel?: number` | Lists occupations used for service classification and valuation. |
| `GET` | `/api/occupations/:id` | No | `path.id: string` | Returns one occupation with service stats and service count. |

### Review endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/reviews` | Yes | `body.exchangeId: string`, `body.rating: integer 1-5`, `body.comment?: string` | Requester reviews a completed exchange. Updating the provider's reputation and credibility happens server-side. |
| `GET` | `/api/reviews/provider/:id` | No | `query.limit?: number = 20`, `query.offset?: number = 0` | Lists reviews for one provider and returns average rating. |

### Proof and credibility endpoints

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/proofs` | Yes | `body.occupationId: uuid`, `body.proofType: "certificate" | "portfolio" | "link" | "image"`, `body.proofUrl: url`, `body.description?: string (max 500)`, `body.declaredLevel?: "beginner" | "intermediate" | "expert"` | Uploads a proof for a skill. |
| `POST` | `/api/proofs/:id/vote` | Yes | `body.voteType: "valid" | "irrelevant" | "fake"` | Records or updates one user's vote on a proof. |

### Valuation endpoint

| Method | Path | Auth | Inputs | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/valuation/estimate` | No | `query.occupationId?: string`, `query.providerId?: string`, `query.hours?: number = 1` | Estimates credits without creating an exchange. |

### Socket.IO events

Socket auth:

```text
socket.auth = { token: "<JWT>" }
```

Configured default path:

```text
/socket.io
```

| Event | Direction | Payload | Description |
| --- | --- | --- | --- |
| `join_conversation` | client -> server | `{ conversationId: string }` | Joins the room for one conversation. |
| `send_message` | client -> server | `{ conversationId: string, content: string, clientId?: string | null }` | Sends a message if the user belongs to the conversation and it is not locked. |
| `message_received` | server -> room | `{ conversationId: string, message: {...}, clientId?: string | null }` | Broadcast when a message is stored. |
| `mark_read` | client -> server | `{ conversationId: string }` | Marks unread messages as read. |
| `mark_read` | server -> room | `{ conversationId: string, readerId: string, readAt: string }` | Broadcast when read state changes. |

### Environment and config reference

#### Root scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts client and server together. |
| `npm run dev:client` | Starts only the frontend. |
| `npm run dev:server` | Starts only the API. |
| `npm run build` | Builds client and server. |
| `npm run install:all` | Installs client and server dependencies. |
| `npm run prisma:generate` | Generates the Prisma client in `server/`. |
| `npm run prisma:migrate` | Runs Prisma migrations in `server/`. |
| `npm run prisma:studio` | Opens Prisma Studio from `server/`. |

#### Client environment variables

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | `string` | `http://localhost:5000` | Base URL for HTTP requests from the frontend. |
| `VITE_SOCKET_URL` | `string` | falls back to `VITE_API_URL` | Base URL for Socket.IO. |
| `VITE_SOCKET_PATH` | `string` | `/socket.io` | Socket.IO path used by the client. |
| `GEMINI_API_KEY` | `string` | none | Exposed in Vite config, but there is no current feature that uses it. `[NEEDS CLARIFICATION]` |

#### Server environment variables

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | `string` | none | Main PostgreSQL connection string. Required. |
| `DIRECT_DATABASE_URL` | `string` | none | Direct PostgreSQL URL required by Prisma schema for migrations. Missing from `server/.env.example`. `[NEEDS CLARIFICATION]` |
| `JWT_SECRET` | `string` | `fallback-secret-change-in-production` | Secret used to sign JWTs. Safe only for local development. |
| `JWT_EXPIRES_IN` | `string` | `7d` | Token lifetime. |
| `PORT` | `number` | `5000` | API server port. |
| `NODE_ENV` | `string` | `development` | Controls logging and production checks. |
| `CORS_ORIGIN` | `string` | `http://localhost:3000` | Allowed frontend origin. |
| `SOCKET_PATH` | `string` | `/socket.io` | Socket.IO path. |
| `CHAT_MESSAGE_MAX_LENGTH` | `number` | `2000` | Maximum chat message length. |
| `CHAT_RATE_LIMIT_WINDOW_MS` | `number` | `60000` | Chat rate-limit window in milliseconds. |
| `CHAT_RATE_LIMIT_MAX` | `number` | `30` | Maximum chat sends per user per rate-limit window. |
| `REDIS_URL` | `string` | empty string | Enables the Redis adapter for Socket.IO when set. |
| `SEPOLIA_RPC` | `string` | empty | RPC endpoint for optional blockchain logging. |
| `PRIVATE_KEY` | `string` | empty | Server wallet key used to submit on-chain receipts. |
| `CONTRACT_ADDRESS` | `string` | empty | Deployed `TimeBankLedger` address. |

#### Blockchain workspace environment variables

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `SEPOLIA_RPC` | `string` | empty | RPC endpoint used by Hardhat deployment. |
| `PRIVATE_KEY` | `string` | empty | Deployer wallet key for Hardhat. |
| `ETHERSCAN_API_KEY` | `string` | empty | Optional key for contract verification workflows. |

## Contributing
The repository is already structured for local development, but a few contributor expectations are only implied by the code and config rather than documented formally.

### Local development workflow

Install the active workspaces and start the app:

```bash
npm run install:all
npm run prisma:generate
npm run prisma:migrate
cd server && npm run seed
cd ..
npm run dev
```

If you touch the smart contract too:

```bash
cd blockchain
npm install
npm run compile
```

### Code style expectations

The repo already signals a few style rules:

- Prettier is configured at the root with 2-space indentation, semicolons, single quotes, and `printWidth: 100`.
- The frontend has ESLint scripts.
- The backend uses strict TypeScript settings.
- The codebase is organized by feature area: `controllers`, `routes`, `schemas`, `services`, and `pages`.

Useful commands before opening a PR:

```bash
npm run build
cd client && npm run lint
cd ../server && npm run build
```

If your change affects Prisma or occupation data, also run:

```bash
cd server
npm run prisma:generate
```

If your change affects the smart contract, also run:

```bash
cd blockchain
npm run compile
```

