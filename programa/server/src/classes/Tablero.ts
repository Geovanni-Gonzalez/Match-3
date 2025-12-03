import { Celda } from './Celda';
import { Configuracion, Coordenada } from '../interfaces';

/**
 * Tablero - Gestiona la matriz de celdas del juego Match-3
 * REQ-018: Inicialización sin matches, relleno con gravedad y prevención de matches
 */
export class Tablero {
    public matriz: Celda[][] = [];
    private config: Configuracion;

    /**
     * constructor - Crea el tablero e inicializa la matriz sin matches
     * @param config - Configuración del juego (dimensiones, colores válidos)
     */
    constructor(config: Configuracion) {
        this.config = config;
        this.inicializar();
    }

    /**
     * inicializar - Genera la matriz inicial con colores completamente aleatorios
     * NOTA: Permite matches desde el inicio (es parte del juego encontrarlos)
     * @restricciones - Ninguna, los colores son 100% aleatorios
     */
    private inicializar(): void {
        const { TAMANIO_FILA: R, TAMANIO_COLUMNA: C, COLORES_VALIDOS } = this.config;
        
        console.log('[TABLERO] Inicializando tablero...');
        console.log(`[TABLERO] Dimensiones: ${R}x${C}`);
        console.log(`[TABLERO] Colores disponibles: ${COLORES_VALIDOS.join(', ')}`);

        for (let r = 0; r < R; r++) {
            this.matriz[r] = [];
            for (let c = 0; c < C; c++) {
                // Generar color completamente aleatorio (sin restricciones)
                const colorAleatorio = COLORES_VALIDOS[Math.floor(Math.random() * COLORES_VALIDOS.length)];
                this.matriz[r][c] = new Celda(r, c, colorAleatorio);
            }
        }
        
        console.log('[TABLERO] ✓ Tablero inicializado con colores aleatorios');
    }

    /**
     * generarColorSinMatch - Genera color aleatorio que no forme match de 3 en inicialización
     * REQ-018: Previene matches durante la generación secuencial del tablero
     * @param fila - Posición vertical (0 a TAMANIO_FILA-1)
     * @param columna - Posición horizontal (0 a TAMANIO_COLUMNA-1)
     * @param coloresValidos - Array de colores permitidos
     * @returns Color válido que no forma match con celdas previas
     * @restricciones - Solo verifica celdas ya generadas (arriba e izquierda)
     */
    private generarColorSinMatch(fila: number, columna: number, coloresValidos: string[]): string {
        const coloresProhibidos: Set<string> = new Set();

        // Verificar horizontal: 2 celdas a la izquierda
        if (columna >= 2) {
            const color1 = this.matriz[fila][columna - 1]?.colorID;
            const color2 = this.matriz[fila][columna - 2]?.colorID;
            if (color1 && color2 && color1 === color2) {
                coloresProhibidos.add(color1);
            }
        }

        // Verificar vertical: 2 celdas arriba
        if (fila >= 2) {
            const color1 = this.matriz[fila - 1][columna]?.colorID;
            const color2 = this.matriz[fila - 2][columna]?.colorID;
            if (color1 && color2 && color1 === color2) {
                coloresProhibidos.add(color1);
            }
        }

        const coloresDisponibles = coloresValidos.filter(color => !coloresProhibidos.has(color));

        // si todos estan prohibidos, elegir cualquiera
        if (coloresDisponibles.length === 0) {
            console.warn(`[TABLERO] Advertencia: No hay colores disponibles en [${fila},${columna}], usando color aleatorio`);
            return coloresValidos[Math.floor(Math.random() * coloresValidos.length)];
        }

        return coloresDisponibles[Math.floor(Math.random() * coloresDisponibles.length)];
    }

    /**
     * obtenerCelda - Obtiene una celda específica del tablero con validación de límites
     * @param r - Fila (0 a TAMANIO_FILA-1)
     * @param c - Columna (0 a TAMANIO_COLUMNA-1)
     * @returns Celda si existe, undefined si está fuera de límites
     */
    public obtenerCelda(r: number, c: number): Celda | undefined {
        if (r >= 0 && r < this.config.TAMANIO_FILA && c >= 0 && c < this.config.TAMANIO_COLUMNA) {
            return this.matriz[r][c];
        }
        return undefined;
    }

    /**
     * detectarGrupoDesde - Detecta el grupo completo de 3+ celdas del mismo color desde una celda inicial
     * Usa algoritmo flood fill (BFS) para encontrar TODAS las celdas conectadas del mismo color
     * @param r - Fila inicial
     * @param c - Columna inicial
     * @returns Array de coordenadas que forman el grupo, o array vacío si no hay grupo válido (< 3)
     */
    public detectarGrupoDesde(r: number, c: number): Coordenada[] {
        const celda = this.obtenerCelda(r, c);
        if (!celda) return [];

        const color = celda.colorID;
        const visitadas = new Set<string>();
        const grupoCompleto: Coordenada[] = [];
        
        // Cola para BFS (Breadth-First Search)
        const cola: Coordenada[] = [{ r, c }];
        visitadas.add(`${r},${c}`);

        // Direcciones: horizontal, vertical y diagonales (8 direcciones)
        const direcciones = [
            { dr: 0, dc: 1 },   // Derecha
            { dr: 0, dc: -1 },  // Izquierda
            { dr: 1, dc: 0 },   // Abajo
            { dr: -1, dc: 0 },  // Arriba
            { dr: 1, dc: 1 },   // Diagonal abajo-derecha
            { dr: -1, dc: -1 }, // Diagonal arriba-izquierda
            { dr: 1, dc: -1 },  // Diagonal abajo-izquierda
            { dr: -1, dc: 1 }   // Diagonal arriba-derecha
        ];

        // BFS: explorar todas las celdas conectadas
        while (cola.length > 0) {
            const actual = cola.shift()!;
            grupoCompleto.push(actual);

            // Explorar vecinos
            for (const { dr, dc } of direcciones) {
                const nr = actual.r + dr;
                const nc = actual.c + dc;
                const clave = `${nr},${nc}`;

                // Saltar si ya fue visitada
                if (visitadas.has(clave)) continue;

                const celdaVecina = this.obtenerCelda(nr, nc);
                
                // Si existe, tiene el mismo color y no ha sido visitada
                if (celdaVecina && celdaVecina.colorID === color) {
                    visitadas.add(clave);
                    cola.push({ r: nr, c: nc });
                }
            }
        }

        // Solo retornar si hay 3 o más celdas
        if (grupoCompleto.length < 3) return [];

        console.log(`[TABLERO] Grupo detectado desde [${r},${c}]: ${grupoCompleto.length} celdas del color ${color}`);
        return grupoCompleto;
    }

    /**
     * detectarMatches - Detecta todas las celdas que forman matches de 3+ colores consecutivos
     * @returns Array de coordenadas de celdas que forman matches (horizontal y vertical)
     * @restricciones - Solo detecta líneas rectas, no diagonales
     */
    public detectarMatches(): Coordenada[] {
        const { TAMANIO_FILA: R, TAMANIO_COLUMNA: C } = this.config;
        const celdasConMatch: Set<string> = new Set(); // Usa Set para evitar duplicados

        // Escanear matches horizontales (por filas)
        for (let r = 0; r < R; r++) {
            let colorActual = this.matriz[r][0].colorID;
            let conteo = 1;
            let inicio = 0;

            for (let c = 1; c < C; c++) {
                if (this.matriz[r][c].colorID === colorActual) {
                    conteo++;
                } else {
                    // Si hay match de 3+, registrar todas las celdas
                    if (conteo >= 3) {
                        for (let i = inicio; i < c; i++) {
                            celdasConMatch.add(`${r},${i}`);
                        }
                    }
                    // Reiniciar conteo
                    colorActual = this.matriz[r][c].colorID;
                    conteo = 1;
                    inicio = c;
                }
            }
            // Verificar último segmento de la fila
            if (conteo >= 3) {
                for (let i = inicio; i < C; i++) {
                    celdasConMatch.add(`${r},${i}`);
                }
            }
        }

        // Escanear matches verticales (por columnas)
        for (let c = 0; c < C; c++) {
            let colorActual = this.matriz[0][c].colorID;
            let conteo = 1;
            let inicio = 0;

            for (let r = 1; r < R; r++) {
                if (this.matriz[r][c].colorID === colorActual) {
                    conteo++;
                } else {
                    // Si hay match (3+), marcar las celdas
                    if (conteo >= 3) {
                        for (let i = inicio; i < r; i++) {
                            celdasConMatch.add(`${i},${c}`);
                        }
                    }
                    // Reiniciar conteo
                    colorActual = this.matriz[r][c].colorID;
                    conteo = 1;
                    inicio = r;
                }
            }
            // Verificar último segmento de la columna
            if (conteo >= 3) {
                for (let i = inicio; i < R; i++) {
                    celdasConMatch.add(`${i},${c}`);
                }
            }
        }

        // Convertir Set<string> a Coordenada[]
        const resultado: Coordenada[] = [];
        celdasConMatch.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            resultado.push({ r, c });
        });

        return resultado;
    }

    /**
     * procesarMatchesEnCascada - Procesa eliminación y relleno (SIN combos automáticos)
     * @param celdasInicialesEliminadas - Coordenadas del match inicial del jugador
     * @returns Objeto con totalCeldasEliminadas, comboMultiplicador e historialCombos
     * @restricciones - Solo procesa el match del jugador, no busca combos adicionales
     */
    public procesarMatchesEnCascada(celdasInicialesEliminadas: Coordenada[]): {
        totalCeldasEliminadas: number;
        comboMultiplicador: number;
        historialCombos: Coordenada[][];
    } {
        console.log('\n[TABLERO] ========== PROCESANDO MATCH DEL JUGADOR ==========');
        console.log(`[TABLERO]  ${celdasInicialesEliminadas.length} celdas a eliminar`);
        
        const historialCombos: Coordenada[][] = [];
        historialCombos.push([...celdasInicialesEliminadas]);

        // Rellenar las celdas eliminadas (sin gravedad)
        const celdasModificadas = this.rellenarDespuesDeMatch(celdasInicialesEliminadas);
        
        console.log(`[TABLERO] ========================================`);
        console.log(`[TABLERO] Match procesado:`);
        console.log(`[TABLERO]   - Celdas eliminadas: ${celdasInicialesEliminadas.length}`);
        console.log(`[TABLERO]   - Celdas rellenadas: ${celdasModificadas.length}`);
        console.log(`[TABLERO] ==========================================\n`);

        return {
            totalCeldasEliminadas: celdasInicialesEliminadas.length,
            comboMultiplicador: 1, // Sin combos en cascada, siempre 1x
            historialCombos
        };
    }

    /**
     * rellenarDespuesDeMatch - Rellena las celdas eliminadas con colores aleatorios (SIN gravedad)
     * REQ-018: Genera nuevos colores en las posiciones exactas de las celdas eliminadas
     * @param celdasEliminadas - Coordenadas de las celdas a rellenar
     * @returns Array de coordenadas de las celdas modificadas
     * @restricciones - Nuevas celdas no deben formar matches de 3+ al generarse
     */
    public rellenarDespuesDeMatch(celdasEliminadas: Coordenada[]): Coordenada[] {
        console.log('[TABLERO] ========== RELLENO DESPUÉS DE MATCH ==========');
        console.log(`[TABLERO] Celdas a rellenar: ${celdasEliminadas.length}`);
        
        const { COLORES_VALIDOS } = this.config;
        const celdasModificadas: Coordenada[] = [];

        // Rellenar cada celda eliminada con un nuevo color aleatorio
        for (const { r, c } of celdasEliminadas) {
            // Generar color que no forme match inmediato
            const colorValido = this.generarColorSinMatchEnPosicion(r, c, COLORES_VALIDOS);
            
            // Crear nueva celda en la misma posición
            this.matriz[r][c] = new Celda(r, c, colorValido);
            celdasModificadas.push({ r, c });
            
            console.log(`[TABLERO] Celda [${r},${c}] rellenada con color: ${colorValido}`);
        }

        console.log(`[TABLERO] ✓ Relleno completado. ${celdasModificadas.length} celdas modificadas`);
        console.log('[TABLERO] =============================================');
        
        return celdasModificadas;
    }

    /**
     * generarColorSinMatchEnPosicion - Genera color verificando la matriz completa en todas direcciones
     * REQ-018: Previene matches al generar nuevas celdas después de aplicar gravedad
     * @param fila - Posición vertical de la nueva celda
     * @param columna - Posición horizontal de la nueva celda
     * @param coloresValidos - Array de colores permitidos
     * @returns Color que no forma match de 3+ en ninguna dirección
     * @restricciones - Verifica izq/der (horizontal) y arriba/abajo (vertical)
     */
    private generarColorSinMatchEnPosicion(fila: number, columna: number, coloresValidos: string[]): string {
        const coloresProhibidos: Set<string> = new Set();

        // Patrón: [X][X][?] - 2 iguales a la izquierda
        if (columna >= 2) {
            const color1 = this.matriz[fila][columna - 1]?.colorID;
            const color2 = this.matriz[fila][columna - 2]?.colorID;
            if (color1 && color2 && color1 === color2) {
                coloresProhibidos.add(color1);
            }
        }

        // Patrón: [X][?][X] - igual a izq y derecha
        if (columna >= 1 && columna < this.config.TAMANIO_COLUMNA - 1) {
            const colorIzq = this.matriz[fila][columna - 1]?.colorID;
            const colorDer = this.matriz[fila][columna + 1]?.colorID;
            if (colorIzq && colorDer && colorIzq === colorDer) {
                coloresProhibidos.add(colorIzq);
            }
        }

        // Patrón: [?][X][X] - 2 iguales a la derecha
        if (columna < this.config.TAMANIO_COLUMNA - 2) {
            const color1 = this.matriz[fila][columna + 1]?.colorID;
            const color2 = this.matriz[fila][columna + 2]?.colorID;
            if (color1 && color2 && color1 === color2) {
                coloresProhibidos.add(color1);
            }
        }

        // Verificar vertical: dos celdas arriba
        if (fila >= 2) {
            const color1 = this.matriz[fila - 1][columna]?.colorID;
            const color2 = this.matriz[fila - 2][columna]?.colorID;
            if (color1 && color2 && color1 === color2) {
                coloresProhibidos.add(color1);
            }
        }

        // Patrón vertical: [X][?][X] - igual arriba y abajo
        if (fila >= 1 && fila < this.config.TAMANIO_FILA - 1) {
            const colorArr = this.matriz[fila - 1][columna]?.colorID;
            const colorAba = this.matriz[fila + 1][columna]?.colorID;
            if (colorArr && colorAba && colorArr === colorAba) {
                coloresProhibidos.add(colorArr);
            }
        }

        // Patrón vertical: [?][X][X] - 2 iguales abajo
        if (fila < this.config.TAMANIO_FILA - 2) {
            const color1 = this.matriz[fila + 1][columna]?.colorID;
            const color2 = this.matriz[fila + 2][columna]?.colorID;
            if (color1 && color2 && color1 === color2) {
                coloresProhibidos.add(color1);
            }
        }

        const coloresDisponibles = coloresValidos.filter(color => !coloresProhibidos.has(color));

        // si todos prohibidos, elegir aleatorio
        if (coloresDisponibles.length === 0) {
            console.warn(`[TABLERO] Advertencia: No hay colores disponibles en [${fila},${columna}]`);
            return coloresValidos[Math.floor(Math.random() * coloresValidos.length)];
        }

        return coloresDisponibles[Math.floor(Math.random() * coloresDisponibles.length)];
    }

    /**
     * actualizarCeldas - Actualiza celdas específicas con nuevos colores aleatorios (método legacy)
     * REQ-026: Reemplaza celdas después de validación de match
     * @param listaCeldas - Coordenadas de las celdas a actualizar
     * @restricciones - Colores generados no forman matches iniciales
     */
    public actualizarCeldas(listaCeldas: Coordenada[]): void {
        console.log('[TABLERO] Actualizando celdas manualmente...');
        const { COLORES_VALIDOS } = this.config;
        for (const { r, c } of listaCeldas) {
            const colorValido = this.generarColorSinMatch(r, c, COLORES_VALIDOS);
            this.matriz[r][c] = new Celda(r, c, colorValido);
            this.matriz[r][c].establecerEstado('libre');
        }
        console.log(`[TABLERO] ✓ ${listaCeldas.length} celdas actualizadas`);
    }

    /**
     * obtenerEstadoTablero - Serializa la matriz completa para envío al cliente
     * @returns Array 2D con objetos {fila, columna, color, estado} de cada celda
     */
    public obtenerEstadoTablero(): any[][] {
        return this.matriz.map(fila => 
            fila.map(celda => ({
                fila: celda.fila,
                columna: celda.columna,
                color: celda.colorID,
                estado: celda.estado
            }))
        );
    }

    /**
     * imprimirTablero - Muestra el tablero en consola para debugging
     * @output Imprime cada fila con abreviaciones de 2 letras de cada color
     */
    public imprimirTablero(): void {
        console.log('[TABLERO] Estado actual del tablero:');
        for (let r = 0; r < this.config.TAMANIO_FILA; r++) {
            const fila = this.matriz[r].map(celda => {
                const colorAbrev = celda.colorID.substring(0, 2).toUpperCase();
                return colorAbrev;
            }).join(' ');
            console.log(`  Fila ${r}: ${fila}`);
        }
    }
}