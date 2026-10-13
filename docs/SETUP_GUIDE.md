# TenderLens Setup & Developer Guide

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Python**: `3.11+`
- **Docker & Docker Compose**: For running PostgreSQL 16, Redis 7, and Neo4j 5.
- **Git**

---

## 1. Quick Start with Docker Compose

To boot the database infrastructure:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL**: `localhost:5432` (`tenderlens` / `tenderlens`)
- **Redis**: `localhost:6379`
- **Neo4j**: `localhost:7474` (HTTP browser), `localhost:7687` (Bolt protocol)

---

## 2. Environment Variables

Copy the template to your environment files:

```bash
# In tenderlens root
cp .env.example .env
cp .env.example server/.env
cp client/.env.example client/.env
```

Ensure the database credentials match your docker container settings:
```ini
DATABASE_URL=postgresql://tenderlens:tenderlens@localhost:5432/tenderlens
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tenderlens123
```

---

## 3. Database Initialization & Seeding

Run database migrations and seed realistic procurement dataset:

```bash
# Run migrations
npm run db:migrate

# Seed demo dataset (tenders, companies, bids, review indicators)
npm run db:seed
```

To wipe and re-seed from scratch:
```bash
npm run db:reset
```

---

## 4. Running the Development Servers

You can run each service independently or concurrently:

### Option A: Run Full Stack Simultaneously
```bash
npm run dev:all
```
This runs:
- Backend server on `http://localhost:5000`
- Frontend client on `http://localhost:5173`
- AI microservice on `http://localhost:8000`

### Option B: Run Services Individually

1. **Backend Server**:
   ```bash
   npm run dev:server
   ```

2. **Frontend Client**:
   ```bash
   npm run dev:client
   ```

3. **AI Microservice**:
   ```bash
   npm run dev:ai
   ```
   *(Or on Windows PowerShell: `.\scripts\dev-ai.ps1`)*

---

## 5. Verification & Testing

- **Client Web UI**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **AI Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Neo4j Browser**: [http://localhost:7474](http://localhost:7474)

### Default Admin Credentials
- **Email**: `admin@tenderlens.gov`
- **Password**: `Admin123!`
*(Or refer to `server/src/db/seeds/procurement-base.js` for seeded credentials)*

---

## 6. Linting & Code Quality

```bash
# Lint both client and server
npm run lint

# Format code with Prettier
npm run format

# Production client build test
npm run build
```
