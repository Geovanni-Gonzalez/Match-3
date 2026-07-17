# TECHNICAL_REVIEW — Match-3

Fecha de revisión: 2026-07-16
Método: análisis estático, enunciado (`docs/Proyecto Programado 4 Match 3.md`, IC-4700 Lenguajes de Programación), configuración, CI y git. Tests ejecutados localmente: server Jest pasa y client React Testing Library pasa; CI ahora ejecuta ambas suites antes del build.

## 1. Comprensión del proyecto

Juego Match-3 multijugador en tiempo real: monorepo TypeScript con `client` (React + CRA/craco + Tailwind), `server` (Express + Socket.IO + MySQL) y `shared` (contratos de tipos). El servidor es la autoridad del estado: valida matches en un **Worker Thread**, gestiona lobby/partidas/timers y persiste jugadores y ranking en MySQL.

## 2. Arquitectura

| Área | Evidencia |
|---|---|
| Servidor autoritativo con capas core/domain/services/repositories | `server/src/core/{domain,manager,repositories,services,workers}` |
| Validación de matches fuera del hilo principal (adyacencia, color, línea recta, n≥3) | `core/workers/matchWorker.ts` (worker_threads) |
| Tiempo real: sockets segregados por dominio | `sockets/{game,lobby,player}.sockets.ts` |
| Persistencia MySQL con pool async | `repositories/dbPool.ts` (mysql2/promise, connectionLimit 10), `PartidaRepo`, `PlayerRepo`, `scripts/initDb.ts` |
| Validación de entrada en API | `utils/validation.schemas.ts` (Joi) + `validate.middleware.ts` |
| Tipos compartidos client/server | `shared/types.ts` (workspace npm) |
| Timers de partida centralizados | `core/manager/TimerManager.ts` |
| Tooling | Husky pre-commit, ESLint+Prettier, Docker + docker-compose, script ngrok para demos |

## 3. Cumplimiento del enunciado

Enunciado pide juego Match-3 multijugador (2-4 jugadores), modalidades y ranking. ✅ Verificado por análisis estático: `crearPartidaSchema` valida `tipoJuego` (Match/Tiempo), `tematica` (3 temas), `numJugadoresMax` 2-4, duración; vistas de lobby, sala de espera, ranking histórico y resultado en `client/src/views/`. La corrida multijugador no se verificó por ejecución.

## 4. Calidad y pruebas

- ✅ Suites Jest/React Testing Library en server y client: `MatchService.test.ts`, `Celda.test.ts`, `Bienvenida.test.tsx` — incluye test de frontend (raro en el portafolio).
- ✅ CI ejecuta tests de server y client antes de construir ambos workspaces.
- JSDoc descriptivo real (no boilerplate) en workers y repositorios.
- `.env` con credenciales locales existe en disco pero **no está trackeado** (verificado); `.env.example` presente en ambos paquetes.

## 5. Fortalezas

1. Único proyecto del portafolio con **concurrencia explícita** (worker_threads) y con **MySQL real** (pool, script de init) — cubre dos vacíos identificados en el lote 1.
2. Arquitectura autoritativa consciente del problema de sincronización (el README lo articula como caso de estudio).
3. Monorepo con contratos compartidos — práctica de industria.

## 6. Debilidades y riesgos

| Hallazgo | Severidad | Nota |
|---|---|---|
| Tests de sockets ausentes | Media | Falta validar lobby/join/turnos end-to-end con `socket.io-client` |
| `any[]` en las firmas del worker (`listaCeldas: any[]`) | Baja-Media | Contradice el valor "TypeScript de extremo a extremo" |
| Contraseña personal en `.env` local (`server/.env`) | Baja | No trackeado, pero conviene rotarla y usar una dummy en dev |
| Scaffolding duplicado: `programa/.github/` anidado y `.husky/_/` interno | Baja | Ruido |

## 7. Evaluación profesional

- 30 segundos: README con caso de estudio + badges — bien posicionado.
- 5 minutos: workers, repos y sockets segregados sostienen la impresión; los `any` y el CI incompleto la rebajan.
- Nivel demostrado: **Mid** en backend en tiempo real. Justificación: decisiones de arquitectura correctas para estado compartido (autoridad, workers, validación server-side) y CI con tests; le falta rigor de tipos y tests de sockets para Mid+.

## 8. Recomendaciones

Ver `IMPROVEMENT_ROADMAP.md`. P0 de CI aplicado; siguiente foco: tipar el worker y cubrir sockets.
