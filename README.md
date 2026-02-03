# FairHour

A modern Time Banking Platform where users exchange skills and services using time credits instead of money. Inspired by professional freelance marketplaces.

## Project Structure

```
fairhour/
├── client/                  # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   ├── types.ts         # TypeScript types
│   │   └── constants.ts     # App constants and config
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.cjs        # ESLint configuration
│   └── package.json
├── server/                  # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
├── .prettierrc              # Prettier configuration
├── package.json             # Root scripts
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (for backend)

## Getting Started

### 1. Install Dependencies

```bash
# Install both client and server dependencies
npm run install:all

# Or install individually
npm run install:client
npm run install:server
```

### 2. Setup Environment Variables

**Client** (`client/.env.local`):
```env
GEMINI_API_KEY=your_gemini_api_key
```

**Server** (`server/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/fairhour
DIRECT_URL=postgresql://user:password@localhost:5432/fairhour
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

### 3. Setup Database (Server)

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (optional)
npm run prisma:studio
```

### 4. Run Development Servers

```bash
# Run frontend (port 3000)
npm run dev:client

# Run backend (port 4000)
npm run dev:server
```

## Code Quality

### Linting & Formatting

The project uses ESLint and Prettier for code quality:

```bash
# Run ESLint (in client directory)
cd client
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format code with Prettier
npm run format
```

### Configuration Files

- **ESLint**: `client/.eslintrc.cjs` - TypeScript and React-specific rules
- **Prettier**: `.prettierrc` (root level) - Consistent code formatting

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:client` | Start frontend dev server |
| `npm run dev:server` | Start backend dev server |
| `npm run build:client` | Build frontend for production |
| `npm run build:server` | Build backend for production |
| `npm run install:all` | Install all dependencies |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

### Client-specific Scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint checks |
| `npm run format` | Format code with Prettier |

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router v7
- Framer Motion
- Tailwind CSS
- Recharts
- Lucide Icons
- ESLint + Prettier

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod Validation
- bcrypt

## License

MIT

