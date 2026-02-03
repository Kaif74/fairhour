# FairHour Backend API

A secure, production-ready backend for the FairHour time-banking platform built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Update the following variables in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string (min 32 characters)
- `CORS_ORIGIN`: Your frontend URL

### 3. Set Up Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT

### Users (Protected)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

### Services
- `POST /api/services` - Create service (Protected)
- `GET /api/services` - List all active services
- `PUT /api/services/:id` - Update service (Protected)
- `DELETE /api/services/:id` - Delete service (Protected)

### Requests (Protected)
- `POST /api/requests` - Create service request
- `GET /api/requests` - List requests
- `PUT /api/requests/:id/status` - Update request status

### Exchanges (Protected)
- `POST /api/exchanges` - Create exchange
- `GET /api/exchanges/me` - List user's exchanges
- `PUT /api/exchanges/:id/complete` - Mark exchange complete

## Security Features

- **Helmet**: Secure HTTP headers
- **CORS**: Restricted origins
- **Rate Limiting**: Auth routes (5/15min), General (100/15min)
- **JWT**: Short-lived access tokens
- **bcrypt**: Password hashing with 12 salt rounds
- **Zod**: Input validation

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app.ts            # Express configuration
│   ├── server.ts         # Entry point
│   ├── config/           # Environment config
│   ├── controllers/      # Route handlers
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── schemas/          # Zod validation schemas
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript definitions
├── .env.example
├── package.json
└── tsconfig.json
```
