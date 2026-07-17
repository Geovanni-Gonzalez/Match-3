# IMPROVEMENT_ROADMAP — Match-3

Backlog priorizado. Impacto/Esfuerzo: Alto/Medio/Bajo.

## Quick Wins

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 1 | Añadir `npm test --workspace=server` (y client) al CI — hay 16 tests sin señal pública | Alto | Bajo | P0 |
| 2 | Rotar la contraseña personal usada en `server/.env` local y dejar una dummy de desarrollo | Medio | Bajo | P0 |
| 3 | GitHub Topics: `typescript`, `socket-io`, `multiplayer`, `game`, `mysql`, `worker-threads`, `react` + descripción | Medio | Bajo | P1 |
| 4 | Eliminar `programa/.github/` anidado (workflow duplicado) y `.husky/_/` si está versionado localmente | Bajo | Bajo | P2 |
| 5 | GIF del flujo lobby → partida en el README | Medio | Bajo | P1 |

## Mejoras técnicas

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 6 | Tipar `matchWorker.ts` con los tipos de `shared/` (eliminar `any[]`) — refuerza el claim "TS end-to-end" | Medio | Bajo | P1 |
| 7 | Tests de sockets (lobby/join/turnos) con `socket.io-client` en Jest | Medio | Medio | P2 |
| 8 | Migraciones versionadas para MySQL (p. ej. `db-migrate` o SQL numerado) en lugar de `initDb.ts` único | Medio | Medio | P2 |

## Mejoras arquitectónicas

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 9 | Reconexión de jugadores (rejoin a partida en curso) — el gap clásico de los juegos por sockets | Alto | Alto | P3 |
| 10 | Pool de workers reutilizable en vez de worker por validación (si aplica) | Bajo | Medio | P3 |

## Mejoras de GitHub

Ya presentes: README caso-de-estudio con badge, LICENSE, `.env.example` en ambos paquetes, Docker, husky. Faltan: Topics (item 3), demo animada (item 5), CI con tests (item 1).
