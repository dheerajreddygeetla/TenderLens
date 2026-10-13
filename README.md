<div align="center">

# 🏛️ TenderLens
### AI-Powered Public Procurement Risk Intelligence & Collusion Detection

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-brightgreen.svg)](https://nodejs.org)
[![Python Version](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.x-018bff.svg)](https://neo4j.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

*Engineered for Government Ombudsmen, Public Auditors, Anti-Corruption Authorities, and C-Suite Oversight.*

</div>

---

## 🌟 Executive Overview

**TenderLens** transforms complex public procurement data into actionable intelligence. By integrating relational procurement pipelines, graph network topology, and unsupervised machine learning, TenderLens detects:
- **Bid-Rigging Cartels & Collusion**: Hidden corporate linkages, rotational bidding rings, and shared beneficial owners.
- **Tender Anomalies**: Unrealistic pricing outliers, suspiciously tight bidding windows, and single-bidder dominance.
- **Document Plagiarism**: Structural, text, and metadata similarity across supposedly competing vendor submissions.
- **Explainable Risk Scoring**: Auditable scoring metrics backed by historical precedents and verifiable indicator trails.

---

## 🚀 Key Platform Features

- **🌐 Interactive 3D Intelligence Dashboard**: Built with Three.js and glassmorphic acrylic aesthetics with instant high-contrast light/dark modes.
- **🕸️ Neo4j Graph Network Explorer**: Interactive force-directed graph (React Flow) revealing subgraphs of shared tenders, affiliated vendors, and department concentration.
- **🤖 Dedicated AI Microservice**:
  - **Isolation Forest**: High-dimensional anomaly scoring on pricing, schedules, and margin distributions.
  - **TF-IDF & Cosine Similarity**: Pairwise document comparison catching copied specifications.
  - **PyMuPDF Engine**: Extraction of text, metadata, and structural markers from raw PDF tender documents.
- **⚡ Real-time WebSocket Bus**: Instantaneous alerts for newly detected risk indicators, live unread counter badges, and workflow updates.
- **🛡️ Enterprise Security**: Role-based Access Control (RBAC), optional TOTP Two-Factor Authentication (2FA), rate limiting, and immutable audit logging.

---

## 📁 Repository Structure

```
tenderlens/
├── ai-service/              # FastAPI Python microservice (NLP, Anomaly, Similarity)
│   ├── app/                 # FastAPI routes, models, and ML services
│   └── requirements.txt     # Python ML dependencies (scikit-learn, pymupdf, numpy)
├── client/                  # Executive React 19 + Vite frontend application
│   ├── public/              # SVG icons & branding assets
│   └── src/                 # Components, 3D scenes, Graph canvas, Contexts, Pages
├── data/                    # Sample procurement datasets & test schemas
├── docker/                  # Production & staging container configurations
│   ├── Dockerfile.ai        # AI Service Python container
│   ├── Dockerfile.client    # Client Nginx container
│   ├── Dockerfile.server    # Server Node.js container
│   └── nginx.conf           # Client SPA routing & API reverse proxy configuration
├── docs/                    # Architectural & developer documentation
│   ├── ARCHITECTURE.md      # Detailed system architecture & sequence diagrams
│   ├── API_REFERENCE.md     # REST API specification & route catalog
│   └── SETUP_GUIDE.md       # Onboarding, environment configuration & local dev
├── scripts/                 # Cross-platform development scripts (Node & PowerShell)
│   ├── dev-ai.js            # Cross-platform AI service runner
│   ├── dev-ai.ps1           # Windows PowerShell AI launcher
│   └── dev-ai.sh            # POSIX bash AI launcher
├── server/                  # Core Node.js / Express backend
│   ├── src/controllers/     # REST controller handlers
│   ├── src/db/migrations/   # PostgreSQL schema migrations
│   ├── src/db/seeds/        # Realistic procurement seed dataset
│   ├── src/jobs/workers/    # BullMQ asynchronous background workers
│   ├── src/routes/          # Express route definitions
│   └── src/services/        # Business logic, Graph sync, Auth, Realtime
├── docker-compose.yml       # Multi-container orchestration (DBs + Full Stack)
├── package.json             # Root monorepo workspace scripts
└── .env.example             # Complete environment configuration template
```

---

## ⚡ Quick Start

### 1. Start Infrastructure
```bash
docker compose up -d postgres redis neo4j
```

### 2. Configure Environment
```bash
cp .env.example .env
cp .env.example server/.env
cp client/.env.example client/.env
```

### 3. Initialize Database & Seed Demo Data
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development Stack
```bash
# Run all services concurrently (Server + Client + AI)
npm run dev:all

# Or run client and server together:
npm run dev
```

Visit the application at: **`http://localhost:5173`**

---

## 🛠️ Monorepo Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs backend server and frontend client concurrently |
| `npm run dev:all` | Runs backend, frontend, and AI microservice simultaneously |
| `npm run dev:server` | Starts the Express API server with nodemon |
| `npm run dev:client` | Starts the Vite dev server with Hot Module Replacement |
| `npm run dev:ai` | Starts the FastAPI AI microservice with uvicorn (cross-platform) |
| `npm run db:migrate` | Applies pending PostgreSQL database migrations |
| `npm run db:seed` | Populates demo tenders, bids, contracts, and risk indicators |
| `npm run db:reset` | Resets the database schema and re-seeds cleanly |
| `npm run lint` | Runs ESLint across both server and client workspaces |
| `npm run format` | Auto-formats source code with Prettier |
| `npm run build` | Compiles client for production deployment |

---

## 📚 Documentation

For in-depth guides, consult the [`docs/`](./docs) directory:
- [System Architecture & Data Flows](./docs/ARCHITECTURE.md)
- [Comprehensive API Reference](./docs/API_REFERENCE.md)
- [Complete Setup & Installation Guide](./docs/SETUP_GUIDE.md)

---

## ⚖️ License & Confidentiality
Confidential and proprietary. Developed for TenderLens procurement intelligence operations.
