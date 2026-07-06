# Match-3 Multiplayer

[![CI](https://github.com/Geovanni-Gonzalez/Match-3/actions/workflows/ci.yml/badge.svg)](https://github.com/Geovanni-Gonzalez/Match-3/actions/workflows/ci.yml)

## Descripción
Juego Match-3 multijugador en tiempo real con TypeScript, cliente React, servidor Node/Socket.IO y persistencia preparada para MySQL.

## Objetivo
Construir un juego competitivo con estado compartido, validación en servidor y tipos compartidos.

## Caso de estudio

### Problema
Un juego Match-3 multijugador necesita mantener el tablero, turnos, puntajes y eventos sincronizados entre clientes. Si cada cliente decide por su cuenta, aparecen estados inconsistentes y ventajas injustas.

### Solución
El proyecto separa el cliente visual, el servidor de autoridad y un paquete compartido de tipos. El servidor concentra las reglas principales y emite eventos en tiempo real para que todos los jugadores vean el mismo estado de partida.

### Arquitectura
- `client`: interfaz React para lobby, tablero y experiencia de juego.
- `server`: API, eventos Socket.IO, validacion y orquestacion de partidas.
- `shared`: contratos TypeScript compartidos entre cliente y servidor.
- `docker-compose.yml`: entorno preparado para servicios auxiliares como base de datos.

### Decisiones técnicas destacadas
- TypeScript de extremo a extremo para reducir errores entre cliente y backend.
- Eventos WebSocket para sincronizacion inmediata de acciones de juego.
- Workspace multipaquete para separar responsabilidades sin duplicar contratos.
- CI que construye cliente y servidor como unidades independientes.

## Tecnologías utilizadas
- TypeScript
- React
- Node.js
- Express
- Socket.IO
- MySQL
- Docker
- Jest

## Funcionalidades principales
- Partidas en tiempo real
- Lobby y eventos
- Tipos compartidos
- API de jugadores/partidas
- Pruebas core

## Mi rol
Desarrollé arquitectura por paquetes, componentes cliente, servidor de sockets/API y validación.

## Aprendizajes clave
- Estructura multipaquete
- Sincronización de estado
- Server-side validation
- Jest
- Docker

## Instalación y ejecución
Instalar dependencias del workspace:
```bash
cd Match-3/programa
npm install
```
Ejecutar servidor y cliente en terminales separadas:
```bash
npm run dev:server
npm run start:client
```
Alternativa con Docker, si el entorno tiene Docker disponible:
```bash
docker compose up --build
```

## Estructura del proyecto
- programa/server/: API/sockets/pruebas
- programa/client/: React
- programa/shared/: tipos
- docker-compose.yml: servicios

## Capturas o demo
![Captura principal](screenshots/principalImage.png)

## Estado del proyecto
Proyecto académico avanzado en desarrollo.

## Valor técnico demostrado
Muestra arquitectura full stack en tiempo real, TypeScript compartido y pruebas.

## Mejoras futuras
- Documentar variables de entorno
- Agregar guia de despliegue
- Ampliar capturas del flujo multijugador

## Autor
Geovanni González  
Estudiante de Ingeniería en Computación  
GitHub: [Geovanni-Gonzalez](https://github.com/Geovanni-Gonzalez)













