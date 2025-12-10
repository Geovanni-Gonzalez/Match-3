/**
 * @file matchWorker.ts
 * @description Worker Thread encargado de validar la lógica de los matches.
 * Recibe una lista de celdas y el estado del tablero para determinar si forman una secuencia válida
 * según las reglas del juego (mismo color, adyacencia, línea recta, mínimo 3).
 */
import { parentPort } from 'worker_threads';

if (parentPort) {
  /**
   * Escucha mensajes del hilo principal.
   * Espera un objeto con la lista de celdas seleccionadas y una representación simplificada del tablero.
   */
  parentPort.on('message', (data: { listaCeldas: any[]; matrizTablero: any[][] }) => {
    const { listaCeldas, matrizTablero } = data;
    const result = validarCadena(listaCeldas, matrizTablero);
    parentPort?.postMessage(result);
  });
}

/**
 * Valida si una secuencia de celdas constituye un match válido.
 * Aplica las siguientes reglas:
 * 1. Longitud mínima de 3 celdas.
 * 2. Todas las celdas deben ser del mismo color.
 * 3. Las celdas deben ser adyacentes y no repetirse.
 * 4. La secuencia debe formar una línea recta (dirección constante).
 *
 * @param listaCeldas Lista de objetos con coordenadas {r, c}.
 * @param matrizTablero Matriz simplificada del tablero con información de colores.
 * @returns Objeto con el resultado de la validación {valido, n, celdas}.
 */
function validarCadena(listaCeldas: any[], matrizTablero: any[][]) {
  const n = listaCeldas.length;

  // Regla 1: Tamaño Mínimo (n >= 3)
  if (n < 3) {
    return { valido: false, n: 0, celdas: [] };
  }

  // Obtener el color objetivo de la primera celda
  const { r: r0, c: c0 } = listaCeldas[0];
  const celdaInicial = matrizTablero[r0]?.[c0];
  if (!celdaInicial) return { valido: false, n: 0, celdas: [] };

  const colorObjetivo = celdaInicial.colorID;

  // Regla 2: Uniformidad de Color
  for (let i = 1; i < n; i++) {
    const { r, c } = listaCeldas[i];
    const celdaActual = matrizTablero[r]?.[c];

    if (!celdaActual || celdaActual.colorID !== colorObjetivo) {
      return { valido: false, n: 0, celdas: [] };
    }
  }

  // -----------------------------------------------------
  // Regla 3: Adyacencia (H, V, o D) y Prohibición de Repetición
  // Y RESTRICCIÓN DE DIRECCIÓN CONSTANTE (Línea recta)
  // -----------------------------------------------------
  const celdasVistas = new Set<string>();
  celdasVistas.add(`${listaCeldas[0].r},${listaCeldas[0].c}`);

  let dirR: number | null = null;
  let dirC: number | null = null;

  for (let i = 1; i < n; i++) {
    const celdaAnterior = listaCeldas[i - 1];
    const celdaActual = listaCeldas[i];

    // 3a. Prohibición de Repetición
    const claveActual = `${celdaActual.r},${celdaActual.c}`;
    if (celdasVistas.has(claveActual)) {
      return { valido: false, n: 0, celdas: [] };
    }
    celdasVistas.add(claveActual);

    // 3b. Adyacencia y Dirección
    const deltaR = celdaActual.r - celdaAnterior.r;
    const deltaC = celdaActual.c - celdaAnterior.c;

    // Verificar adyacencia básica (distancia 1 en cualquier dirección válida)
    const esAdyacente = Math.abs(deltaR) <= 1 && Math.abs(deltaC) <= 1 && (deltaR !== 0 || deltaC !== 0);
    if (!esAdyacente) {
      return { valido: false, n: 0, celdas: [] };
    }

    // 3c. Consistencia de Dirección (Línea Recta)
    if (dirR === null || dirC === null) {
      // Establecer la dirección esperada con el primer par
      dirR = deltaR;
      dirC = deltaC;
    } else {
      // Verificar que los siguientes pares sigan la misma dirección
      if (deltaR !== dirR || deltaC !== dirC) {
        return { valido: false, n: 0, celdas: [] };
      }
    }
  }

  return { valido: true, n: n, celdas: listaCeldas };
}
