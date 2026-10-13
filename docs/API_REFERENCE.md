# TenderLens API Reference

All API endpoints are served under `/api` by default (e.g. `http://localhost:5000/api`).

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | Public |
| `POST` | `/api/auth/login` | Log in with email & password | Public |
| `POST` | `/api/auth/refresh` | Refresh access token using cookie | Public (Cookie) |
| `POST` | `/api/auth/logout` | Revoke session & clear cookies | Authenticated |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions | Authenticated |
| `POST` | `/api/auth/mfa/setup` | Generate TOTP secret and QR code data | Authenticated |
| `POST` | `/api/auth/mfa/enable` | Verify OTP code and enable 2FA | Authenticated |
| `POST` | `/api/auth/mfa/verify` | Complete 2FA login challenge | Public (Challenge) |

---

## 2. Procurement Core

### Tenders (`/api/tenders`)
- `GET /api/tenders` - List tenders with pagination, filtering by department, status, risk level.
- `GET /api/tenders/:id` - Detailed tender overview, bids count, awards, risk summary.
- `POST /api/tenders` - Create tender (`tender:create`).
- `PUT /api/tenders/:id` - Update tender details (`tender:update`).

### Companies (`/api/companies`)
- `GET /api/companies` - List vendor companies, risk scores, total awarded contracts.
- `GET /api/companies/:id` - Vendor profile, registration details, historical bid history.

### Bids & Contracts (`/api/bids`, `/api/contracts`)
- `GET /api/bids` - Bidding submissions per tender.
- `GET /api/contracts` - Awarded contracts, values, execution timelines.

---

## 3. Intelligence & AI Analysis

### Document Intelligence (`/api/documents`)
- `POST /api/documents/upload` - Upload PDF procurement tenders or specs.
- `GET /api/documents/:id` - Get document metadata and text extraction status.
- `GET /api/documents/:id/similarity` - Check similarity scores against historical documents.

### AI Risk Runs (`/api/analysis`)
- `GET /api/analysis/:tenderId` - Retrieve automated risk analysis results.
- `POST /api/analysis/:tenderId/run` - Trigger asynchronous re-analysis of a tender.

### Risk Review Engine (`/api/risks`)
- `GET /api/risks` - List identified risk indicators (e.g., suspicious bidder overlap, price anomalies).
- `GET /api/risks/summary` - Aggregate high/medium/low risk counter statistics.
- `GET /api/risks/:id` - Deep dive into an indicator, explainability breakdown, evidence.
- `PATCH /api/risks/:id/status` - Transition status (`new` -> `under_review` -> `resolved` / `dismissed`).
- `POST /api/risks/:id/notes` - Append investigator notes and audit commentary.

---

## 4. Graph Network & Entity Matching

### Graph Engine (`/api/graph`)
- `GET /api/graph/sync/status` - Check PostgreSQL to Neo4j synchronization health.
- `POST /api/graph/sync` - Trigger full graph re-sync (`company:update`).
- `GET /api/graph/search?q={query}` - Search graph entities (companies, tenders, departments).
- `GET /api/graph/entity/:kind/:id?depth=1` - Fetch ego network neighborhood for visualization.
- `POST /api/graph/preset/:name` - Run pre-configured Cypher queries (e.g. `shared-tenders`).

### Entity Resolution (`/api/entity-matches`)
- `GET /api/entity-matches` - List detected duplicate or alias companies.
- `GET /api/entity-matches/stats` - Summary of pending vs resolved matches.
- `POST /api/entity-matches/generate` - Run matching algorithms on vendors.
- `PATCH /api/entity-matches/:id` - Approve (`merged`) or reject (`separate`) duplicate matches.

---

## 5. Administration & Audit

### Users & Settings (`/api/users`, `/api/settings`)
- `GET /api/users` - Admin user directory.
- `PATCH /api/users/:id/role` - Assign RBAC roles.
- `GET /api/settings` - Platform settings and thresholds.
- `PATCH /api/settings` - Update analysis weights and notification toggles.

### Audit & Reports (`/api/audit`, `/api/reports`)
- `GET /api/audit` - Paginated immutable audit trail.
- `GET /api/reports` - Generate compliance reports in JSON/PDF format.
