/**
 * @file MatchService.ts
 * @description Servicio encargado de la validación lógica de las jugadas (matches).
 * 
 * Implementa las reglas del juego para determinar si una secuencia de celdas
 * seleccionadas constituye un match válido.
 */

import { Coordenada } from '../../interfaces.js';
import { Celda } from '../domain/Celda.js';

export class MatchService {
  /**
   * Valida una cadena de celdas de forma síncrona.
   * 
   * @param celdas - Lista de coordenadas seleccionadas por el jugador.
   * @param tablero - Matriz actual del tablero de juego.
   * @returns Promesa con el resultado de la validación (valido, n, celdas).
   */
  public static async validarCadena(celdas: Coordenada[], tablero: Celda[][]) {
    // Ejecución inmediata sin overhead de Worker Threads
    return this.validarLogica(celdas, tablero);
  }

  /**
   * Implementa la lógica core de validación de matches.
   * 
   * Reglas aplicadas:
   * 1. Tamaño Mínimo: Al menos 3 celdas.
   * 2. Uniformidad de Color: Todas las celdas deben ser del mismo color.
   * 3. No Repetición: Una celda no puede estar dos veces en la selección.
   * 4. Adyacencia: Cada celda debe ser adyacente a la anterior.
   * 5. Linealidad: La secuencia debe formar una línea recta (horizontal, vertical o diagonal).
   * 
   * @param listaCeldas - Lista de coordenadas a validar.
   * @param tablero - Referencia al tablero para consultar colores.
   * @returns Objeto con flag de validez, número de celdas y la lista procesada.
   */
  private static validarLogica(listaCeldas: Coordenada[], tablero: Celda[][]) {
    const n = listaCeldas.length;

    // Regla 1: Tamaño Mínimo (n >= 3)
    if (n < 3) {
        return { valido: false, n: 0, celdas: [] };
    }

    // Obtener el color objetivo de la primera celda
    const { r: r0, c: c0 } = listaCeldas[0];
    const celdaInicial = tablero[r0]?.[c0];
    if (!celdaInicial) return { valido: false, n: 0, celdas: [] };
    
    const colorObjetivo = celdaInicial.colorID;

    // Regla 2: Uniformidad de Color
    for (let i = 1; i < n; i++) {
        const { r, c } = listaCeldas[i];
        const celdaActual = tablero[r]?.[c];
        
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
        const esAdyacente = (Math.abs(deltaR) <= 1 && Math.abs(deltaC) <= 1) && (deltaR !== 0 || deltaC !== 0);
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
}
