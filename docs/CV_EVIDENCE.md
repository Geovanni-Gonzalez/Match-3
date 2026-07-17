# CV_EVIDENCE — Match-3

Verifiable, interview-defensible material. All claims map to files in this repository.

## Resume bullets (pick & adapt)

- Built a real-time multiplayer Match-3 game (2-4 players) as a TypeScript monorepo: React client, authoritative Express + Socket.IO server, and a shared types package to keep client/server contracts in sync.
- Offloaded match validation (color, adjacency, straight-line, min-length rules) to a Node.js Worker Thread, keeping the game loop responsive under concurrent player actions.
- Designed the server as the single source of truth for game state — lobby, turns, timers, and scoring — with domain/services/repositories layering and Joi-validated REST endpoints.
- Persisted players, matches, and historical ranking in MySQL via an async connection pool (mysql2/promise) with an idempotent DB-init script.
- Containerized both services (Docker + docker-compose) and enforced quality gates locally with Husky pre-commit hooks, ESLint, and Prettier.

## Skills matrix

| Skill | Evidence | Depth | Confidence |
|---|---|---|---|
| Real-time systems (Socket.IO, authoritative state) | `server/src/sockets/`, `core/manager/ServidorPartidas.ts` | Medium-Deep | High |
| Node.js concurrency (worker_threads) | `core/workers/matchWorker.ts`, `workerUtility.ts` | Medium | High |
| MySQL + async pooling | `core/repositories/dbPool.ts`, `PartidaRepo`, `PlayerRepo`, `scripts/initDb.ts` | Medium | High |
| TypeScript monorepo / shared contracts | `shared/types.ts`, npm workspaces | Medium | High |
| Input validation (Joi) + middleware | `utils/validation.schemas.ts`, `validate.middleware.ts` | Medium | High |
| React (context, hooks, views) | `client/src/context/`, `hooks/useGameEvents.ts`, 8 views | Medium | High |
| Testing (Jest + React Testing Library) | 3 suites (~16 tests) incl. frontend test | Basic-Medium | High |
| Docker / docker-compose | Dockerfiles in client & server, `docker-compose.yml` | Basic-Medium | High |
| Git hygiene tooling (Husky, ESLint, Prettier) | `.husky/`, `.eslintrc`, `.prettierrc` | Medium | High |

## What this project proves

- First appearance of: **worker threads (explicit concurrency)**, **MySQL with connection pooling**, game-state synchronization, npm workspaces monorepo, frontend testing.
- Reinforces: TypeScript, Express, Socket.IO (shared with BlackJack's socket usage), React, Docker, CI.
- Portfolio role: the multiplayer/concurrency evidence piece.

## ATS keywords

TypeScript, Node.js, Express, Socket.IO, WebSockets, real-time multiplayer, worker threads, concurrency, MySQL, mysql2, connection pooling, React, monorepo, npm workspaces, Joi, input validation, Jest, React Testing Library, Docker, docker-compose, Husky, ESLint, Prettier, game development, state synchronization, authoritative server.
