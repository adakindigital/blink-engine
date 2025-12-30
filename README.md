# Blink Engine

> A reliable, observable, safety-critical backend for the Blink safety app.

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or higher
- [Docker](https://www.docker.com/) and Docker Compose
- [pnpm](https://pnpm.io/) or npm

### Development Setup

1. **Clone and install dependencies:**

   ```bash
   cd blink-engine
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start Docker services (PostgreSQL & Redis):**

   ```bash
   npm run docker:dev
   ```

4. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Running with Docker (Full Stack)

```bash
docker-compose -f docker/docker-compose.yml up -d
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All endpoints (except `/auth/register`, `/auth/login`, `/auth/refresh`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (revoke tokens) |
| GET | `/auth/me` | Get current user |

#### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get user profile |
| PATCH | `/users/profile` | Update user profile |

#### Emergency Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | List all contacts |
| POST | `/contacts` | Create a contact |
| GET | `/contacts/:id` | Get a contact |
| PATCH | `/contacts/:id` | Update a contact |
| DELETE | `/contacts/:id` | Delete a contact |
| POST | `/contacts/:id/set-primary` | Set as primary contact |

#### Location Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/locations` | Record a location |
| POST | `/locations/batch` | Record multiple locations |
| GET | `/locations/history` | Get location history |
| GET | `/locations/latest` | Get latest location |

#### SOS (Safety-Critical)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sos/trigger` | Trigger SOS event |
| POST | `/sos/cancel` | Cancel SOS event |
| POST | `/sos/resolve` | Resolve SOS event |
| GET | `/sos/active` | Get active SOS |
| GET | `/sos/history` | Get SOS history |

#### Admin & Security Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/security-personnel` | Register new security personnel & company |
| GET | `/security/alerts` | Get nearby alerts (Security only) |
| POST | `/security/alerts/:id/claim` | Claim an alert (Security only) |
| POST | `/security/location` | Update personnel location (Security only) |

### Response Format

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... },
    "retryable": true
  }
}
```

## 🏗️ Architecture

```
src/
├── config/          # Configuration management
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── repositories/    # Data access layer
├── domain/
│   ├── entities/    # Domain entities
│   └── errors/      # Typed domain errors
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── utils/           # Shared utilities
└── types/           # TypeScript types
```

### Design Principles

- **MVC + Clean Architecture**: Familiar patterns with proper separation
- **Explicit Error Handling**: All methods return `Result<T, E>` types
- **Safety-First**: SOS flows are idempotent and audited
- **Observability**: Structured logging with correlation IDs
- **Security**: JWT auth, rate limiting, input validation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 📦 Database

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema changes (dev only)
npm run db:push

# Open Prisma Studio
npm run db:studio
```

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run docker:dev` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npx tsx scripts/add-security-personnel.ts` | CLI tool to add security personnel |

## 🔐 Security

- JWT authentication with rotating refresh tokens
- Rate limiting on all endpoints (stricter on auth)
- Helmet security headers
- CORS configuration
- Input validation with Zod
- Password hashing with bcrypt
- No secrets in code - environment variables only
- Audit logging for safety-critical operations

## 📝 License

Private - All rights reserved.
