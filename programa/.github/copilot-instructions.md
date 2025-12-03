# Copilot Instructions for Match-3 Game

This document provides guidance for AI coding agents to effectively contribute to the Match-3 game project.

## Architecture Overview

The project follows a real-time, multiplayer client-server architecture.

- **Client:** A React application bootstrapped with `create-react-app`, located in the `client/` directory. It communicates with the server primarily through Socket.IO for real-time gameplay events.
- **Server:** A Node.js/Express application written in TypeScript, located in the `server/` directory. It manages game logic, player connections, and database interactions.

### Key Files and Directories

- **`server/src/server.ts`**: Main server entry point, sets up Express, Socket.IO, and API routes.
- **`server/src/core/services/GameService.ts`**: The core of the game logic. It handles creating matches, player actions, and state changes.
- **`server/src/sockets/*.sockets.ts`**: These files define the Socket.IO event handlers for different aspects of the game (lobby, game, player).
- **`client/src/services/SocketService.ts`**: Client-side service that wraps Socket.IO communication, providing methods to emit and listen for game events.
- **`server/src/core/repositories/*.ts`**: Contains the database logic for persisting game and player data.

## Real-time Communication with Socket.IO

The primary communication between the client and server is through Socket.IO.

- **Server-side Sockets:** The server listens for events in `server/src/sockets/`. For example, `game.sockets.ts` handles events like `select_cell` and `activate_match`.
- **Client-side Sockets:** The client emits and listens for events using the `SocketService` in `client/src/services/SocketService.ts`.

When adding new real-time features, you will need to:
1.  Add a new event handler in the appropriate `*.sockets.ts` file on the server.
2.  Add a corresponding method in the `GameService` to handle the logic.
3.  Add a method in the client-side `SocketService` to emit the new event.

## Game State Management

The game state is managed entirely on the server. `GameService.ts` is the single source of truth.

- The `ServidorPartidas` singleton (`server/src/core/manager/ServidorPartidas.ts`) holds the state of all active matches in memory.
- When the state changes, the `GameService` emits events to the clients to update their UI. For example, `emitirEstadoPartida` sends the updated board and player information.

## Database Interaction

The project uses a MySQL database for data persistence.

- **Connection Pool:** The database connection is managed by a pool in `server/src/core/repositories/dbPool.ts`.
- **Repositories:** `PartidaRepo.ts` and `PlayerRepo.ts` handle all database operations for matches and players. Use these repositories for any database interactions.

## Development Workflow

- **Client:** Navigate to the `client/` directory and run `npm start` to start the client application.
- **Server:** Navigate to the `server/` directory and run `npm run dev` to start the server in development mode with auto-reloading.

## Coding Conventions

- **TypeScript:** The server is written in TypeScript. Please follow existing coding conventions and use TypeScript features where appropriate.
- **ESM Modules:** The server uses ES modules (`import`/`export`). Remember to include the `.js` extension in relative imports (e.g., `import { GameService } from './core/services/GameService.js';`).
- **Dependency Injection:** `GameService` is injected into the API routes and socket handlers. This pattern is used to decouple the core logic from the transport layer.

## Game Features

The game is a real-time, multiplayer Match-3 puzzle with a 9x7 grid.

### Client-side Functionalities
Users can choose between:
- **Create Game**: Customize game type (Vs. Finite Matches or Vs. Time), theme, and number of players (min 2). A unique game code is generated, and the game awaits players for a configurable duration (3 minutes by default) before cancellation.
- **Join Game**: View a list of available games with details (ID, remaining time, theme, player count). The list updates in real-time. Once a game fills up, a "Join" button activates, loading the game board for all players. Game starts after a 'u' key press and a 3-second countdown.
- **View Ranking**: Access a historical ranking of game winners.

### Game Space
- **Grid**: A 9x7 grid, randomly filled with blue, orange, red, green, yellow, and purple cells.
- **Cell Selection**: Players select one cell at a time. Other players' selections visually block cells. Re-selecting a cell deselects it.
- **Visual States**: Cells can be free, selected by the current player, or selected by another player (blocked).
- **Match Activation**: Combinations are activated by a button press or after 2 seconds of inactivity.

### Combination Management
- **Matching Rules**: Combinations require a minimum of 3 adjacent cells (vertical, horizontal, or diagonal) of the same color.
- **Scoring**: Valid combinations award points based on $n^2$, where $n$ is the number of matched cells (e.g., 3 cells = 9 points, 4 cells = 16 points).
- **Board Update**: Valid matches clear selected cells, award points, and refill the grid with random colors.

### Real-time Displays
- **Timer/Match Count**: A visible timer for time-based games or a counter for remaining matches.
- **Player Scores**: Real-time display of each player's name and partial score.
- **Win Condition**: At game end (time runs out or matches exhausted), winners are determined (ties possible) and results are persisted.

### Game Statistics
After each game, the following are displayed:
- Player names and scores (descending order).
- Game theme.
- Game ID.

### Historical Ranking
Displays past game winners:
- Winner's name.
- Score.
- Theme.
- Time invested.
- Game ID.

## Technical Aspects and Documentation

- **Two Applications**: Server (Node.js/Express) for centralized logic and client (React) for the web interface.
- **Concurrency**: Both client and server must implement mechanisms for real-time concurrency.
- **Version Control**: GitHub must be used, with the repository public or shared with the instructor.
- **Internal Documentation**: Descriptive comments for each function, including inputs, outputs, restrictions, and objectives.
- **External Documentation**: Comprehensive documentation including a cover page, user manual, functional tests (screenshots), problem description, program design (diagrams), libraries used, results analysis, main algorithms, and a Git log.

## Development Workflow

- **Client:** Navigate to the `client/` directory and run `npm start` to start the client application.
- **Server:** Navigate to the `server/` directory and run `npm run dev` to start the server in development mode with auto-reloading.
- **Linting & Formatting (Server):**
    - `npm run lint`: To identify code problems.
    - `npm run format`: To automatically format code.