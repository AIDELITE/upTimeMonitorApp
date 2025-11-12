# upTimeMonitorApp

A lightweight, extensible uptime and availability monitoring application with alerting and reporting. Designed to monitor HTTP(S), TCP and ICMP endpoints, run periodic checks, store results, and notify teams when services become unavailable or degraded.

- Status: Draft / Work in Progress
- Owner: AIDELITE
- Repo: AIDELITE/upTimeMonitorApp

---

## Table of contents

- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting started (Quickstart)](#getting-started-quickstart)
- [Configuration](#configuration)
- [How checks work](#how-checks-work)
- [Alerts & Notifications](#alerts--notifications)
- [API](#api)
- [Database](#database)
- [Docker](#docker)
- [Testing](#testing)
- [Development notes](#development-notes)
- [Contributing](#contributing)
- [License](#license)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Features

- Periodic checks for:
  - HTTP(S) endpoints (status code, response time, optional content checks)
  - TCP/connectivity checks (port reachability)
  - ICMP/ping checks (optional; may require privileges)
- Configurable check intervals and timeouts
- Persistent storage of check results and history
- Alerting via:
  - Email
  - Webhooks
  - (Optional) SMS / third-party integrations (Twilio, PagerDuty)
- Dashboard endpoints (API) to:
  - Create / update / delete checks
  - View current status and history
- Health endpoints for the monitor itself
- Pluggable architecture for adding custom check types and notifiers

---

## Architecture & Tech Stack

This README documents a generic structure — adjust for the actual implementation in this repo.

- Runtime: Node.js (>= 18) or alternative (Go, Python) — confirm by looking at the repository
- Web server: Express / Fastify (or equivalent)
- Database: PostgreSQL, SQLite or MongoDB (configurable via env)
- Background scheduler: node-cron / Bull / agenda or native setInterval workers
- Optional containerization: Docker + Docker Compose

---

## Getting started (Quickstart)

Prerequisites:
- Node.js (>= 18) and npm or yarn
- Docker & Docker Compose (optional, recommended for quick start)
- PostgreSQL or SQLite (if not using Docker)

1. Clone the repository
   ```bash
   git clone https://github.com/AIDELITE/upTimeMonitorApp.git
   cd upTimeMonitorApp
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Copy environment example and edit
   ```bash
   cp .env.example .env
   # edit .env to set DB, EMAIL, and other keys
   ```

4. Run database migrations (if provided)
   ```bash
   npm run migrate
   ```

5. Start the application
   ```bash
   npm run dev
   # or for production build
   npm run build && npm start
   ```

Open the API at http://localhost:3000 (or configured PORT)

---

## Configuration

The app reads configuration from environment variables. Common variables include:

- APP_PORT=3000
- NODE_ENV=development
- DATABASE_URL=postgres://user:pass@localhost:5432/uptime
- SQLITE_FILE=./data/uptime.sqlite (if using sqlite)
- JWT_SECRET=changeme
- CHECK_INTERVAL_DEFAULT=60       # default check interval in seconds
- HTTP_CHECK_TIMEOUT_MS=10000
- NOTIFIER_EMAIL_HOST=smtp.example.com
- NOTIFIER_EMAIL_PORT=587
- NOTIFIER_EMAIL_USER=alerts@example.com
- NOTIFIER_EMAIL_PASS=supersecret
- WEBHOOK_SIGNING_SECRET=secret

Example `.env` snippet:
```env
APP_PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/uptime
JWT_SECRET=replace-me
```

If you add new config keys, document them in `.env.example`.

---

## How checks work

- Each configured "check" includes:
  - id, name, target (url or host:port), type (http|tcp|ping), interval, timeout, expectedStatus / assertions
- A scheduler executes checks on their intervals. Results are stored with:
  - timestamp, responseTime, status (up/down/timeout/error), raw response, assertion results
- On transition from up -> down or recovered -> up, the notification pipeline is triggered.
- Retries and backoff can be configured per-check.

---

## Alerts & Notifications

The notifier subsystem accepts events (check result transitions) and delivers notifications:

- Email: SMTP configured via env vars
- Webhook: configurable URL where POSTs are sent with JSON payload
- Additional providers (optional): Slack, PagerDuty, Twilio — implement providers in `notifiers/` and register them.

Notification payload example:
```json
{
  "checkId": "abc123",
  "checkName": "My API",
  "status": "down",
  "time": "2025-11-12T05:58:35Z",
  "details": {
    "responseTimeMs": 12034,
    "error": "ECONNREFUSED"
  }
}
```

---

## API

This repo provides endpoints for managing checks, retrieving status and history. Example endpoints (adjust to actual implementation):

- GET /api/health - returns application health
- POST /api/checks - create a check
- GET /api/checks - list checks
- GET /api/checks/:id - get check details
- PUT /api/checks/:id - update a check
- DELETE /api/checks/:id - delete a check
- GET /api/checks/:id/history - get historical results
- POST /api/webhooks/test - test webhook delivery

Authentication:
- API tokens / JWT (depending on implementation). Use `Authorization: Bearer <token>`.

Example request to create an HTTP check:
```json
POST /api/checks
{
  "name": "Homepage",
  "type": "http",
  "target": "https://example.com/",
  "interval": 60,
  "timeout": 10000,
  "assertions": {
    "status": 200,
    "bodyContains": "Welcome"
  },
  "notifiers": ["email", "webhook"]
}
```

---

## Database & Persistence

- Store checks and their results in the configured DB.
- Recommended tables/collections:
  - checks: id, name, config JSON, created_at, updated_at
  - check_results: id, check_id, timestamp, status, response_time_ms, details (json)
  - notifications: id, check_result_id, notifer_type, status, payload
- Consider TTL or pruning strategy for old check_results (e.g., retain 30 days).

---

## Docker

A simple Dockerfile + docker-compose pattern is recommended.

Example Docker Compose (simplified):
```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:postgres@db:5432/uptime
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: uptime
    volumes:
      - db_data:/var/lib/postgresql/data
volumes:
  db_data:
```

Build and run:
```bash
docker compose up --build
```

---

## Testing

- Unit tests: run `npm test` or `yarn test`
- Integration tests: may require a running DB and mock providers (use test docker compose)
- Linting & formatting: run `npm run lint` and `npm run format`

Add CI pipeline (GitHub Actions) that:
- installs dependencies
- runs lint, tests
- builds Docker image

---

## Development notes

- Background workers must be idempotent. Consider leader election or job queue if running multiple instances.
- Keep check execution non-blocking and bounded in concurrency to prevent resource exhaustion.
- Use exponential backoff / retries for transient notifier failures and implement dead-letter logging.
- Secure webhooks and API endpoints (signing secrets, rate limiting, authentication).

---

## Contributing

Contributions welcome. Suggested workflow:
1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run tests & linters locally
4. Open a Pull Request describing what you changed and why

Please follow the existing coding style and add tests for new functionality.

---

## License

Specify the project's license here (e.g., MIT). If not decided yet, add a LICENSE file in the repo.

---

## Troubleshooting & FAQ

- App fails to start because it cannot connect to the DB:
  - Check DATABASE_URL and that DB is running.
- Checks are not executed:
  - Confirm scheduler is enabled and intervals are configured.
- Email notifications not sent:
  - Verify SMTP credentials and that your environment allows outbound SMTP.

---
