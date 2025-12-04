🧩 MATCH-3 MULTIJUGADOR — README PROFESIONAL
📌 Introducción

Este proyecto implementa un juego tipo Match-3 multijugador y simultáneo, donde varios jugadores pueden interactuar sobre el mismo tablero en tiempo real, conectándose mediante WebSockets.

La arquitectura está diseñada para ser:

Modular (capas separadas por responsabilidad)

Escalable (uso eficiente de Socket.IO + Domain Driven Design básico)

Segura (la autoridad del juego reside 100% en el servidor)

Consistente (el servidor resuelve concurrencia y actualiza a todos)

Persistente (uso de MySQL para jugadores y partidas)

El cliente está desarrollado en React + Socket.IO client, y el servidor en Node.js + Express + Socket.IO + MySQL.