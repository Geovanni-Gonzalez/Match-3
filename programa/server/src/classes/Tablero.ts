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
     * inicializar - Genera la matriz inicial con colores aleatorios sin matches de 3+
     * REQ-018: Garantiza que no existan matches al inicio del juego
     * @restricciones - No debe haber 3+ colores iguales en línea (horizontal/vertical)
     */
    private inicializar(): void {
        const { TAMANIO_FILA: R, TAMANIO_COLUMNA: C, COLORES_VALIDOS } = this.config;
        
        console.log('[TABLERO] Inicializando tablero...');
        console.log(`[TABLERO] Dimensiones: ${R}x${C}`);
        console.log(`[TABLERO] Colores disponibles: ${COLORES_VALIDOS.join(', ')}`);

        for (let r = 0; r < R; r++) {
            this.matriz[r] = [];
            for (let c = 0; c < C; c++) {
                // Generar color válido que no forme match de 3 en primera instancia
                const colorValido = this.generarColorSinMatch(r, c, COLORES_VALIDOS);
                this.matriz[r][c] = new Celda(r, c, colorValido);
            }
        }
        
        console.log('[TABLERO] ✓ Tablero inicializado sin matches iniciales');
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
     * procesarMatchesEnCascada - Procesa eliminación, gravedad y detección de combos consecutivos
     * @param celdasInicialesEliminadas - Coordenadas del match inicial del jugador
     * @returns Objeto con totalCeldasEliminadas, comboMultiplicador e historialCombos
     * @restricciones - Se detiene cuando no se detectan más matches automáticos
     */
    public procesarMatchesEnCascada(celdasInicialesEliminadas: Coordenada[]): {
        totalCeldasEliminadas: number;
        comboMultiplicador: number;
        historialCombos: Coordenada[][];
    } {
        console.log('\n[TABLERO] ========== PROCESANDO MATCHES EN CASCADA ==========');
        
        let celdasAEliminar = celdasInicialesEliminadas;
        let combo = 1;
        let totalEliminadas = 0;
        const historialCombos: Coordenada[][] = [];

        while (celdasAEliminar.length > 0) {
            console.log(`[TABLERO] 💥 Combo ${combo}: ${celdasAEliminar.length} celdas a eliminar`);
            
            historialCombos.push([...celdasAEliminar]);
            totalEliminadas += celdasAEliminar.length;

            // Aplicar gravedad y generar nuevas celdas
            const celdasModificadas = this.rellenarDespuesDeMatch(celdasAEliminar);
            
            // Buscar matches generados por la gravedad
            celdasAEliminar = this.detectarMatches();
            
            if (celdasAEliminar.length > 0) {
                combo++; // Incrementar multiplicador de combo
                console.log(`[TABLERO] 🎉 ¡Match automático detectado! Continuando combo...`);
            } else {
                console.log(`[TABLERO] ✓ No hay más matches automáticos`);
            }
        }

        console.log(`[TABLERO] ========================================`);
        console.log(`[TABLERO] Cascada finalizada:`);
        console.log(`[TABLERO]   - Combos: ${combo}x`);
        console.log(`[TABLERO]   - Total eliminadas: ${totalEliminadas} celdas`);
        console.log(`[TABLERO] ==========================================\n`);

        return {
            totalCeldasEliminadas: totalEliminadas,
            comboMultiplicador: combo,
            historialCombos
        };
    }

    /**
     * rellenarDespuesDeMatch - Aplica gravedad y genera nuevas celdas después de eliminar matches
     * REQ-018: Implementa caída de celdas y relleno desde arriba sin crear matches inmediatos
     * @param celdasEliminadas - Coordenadas de las celdas a eliminar
     * @returns Array de coordenadas de todas las celdas modificadas (por gravedad + nuevas)
     * @restricciones - Nuevas celdas no deben formar matches de 3+ al generarse
     */
    public rellenarDespuesDeMatch(celdasEliminadas: Coordenada[]): Coordenada[] {
        console.log('[TABLERO] ========== RELLENO DESPUÉS DE MATCH ==========');
        console.log(`[TABLERO] Celdas a rellenar: ${celdasEliminadas.length}`);
        
        const { TAMANIO_FILA: R, TAMANIO_COLUMNA: C, COLORES_VALIDOS } = this.config;
        const celdasModificadas: Coordenada[] = [];

        // Agrupar celdas eliminadas por columna
        const columnas = new Map<number, number[]>();
        for (const { r, c } of celdasEliminadas) {
            if (!columnas.has(c)) {
                columnas.set(c, []);
            }
            columnas.get(c)!.push(r);
        }

        // Procesar cada columna independientemente
        for (const [columna, filasEliminadas] of columnas.entries()) {
            console.log(`[TABLERO] Procesando columna ${columna}: ${filasEliminadas.length} celdas eliminadas`);
            
            filasEliminadas.sort((a, b) => b - a); // Ordenar de abajo hacia arriba

            // Aplicar gravedad: desplazar celdas hacia abajo
            for (let i = 0; i < filasEliminadas.length; i++) {
                const filaVacia = filasEliminadas[i];
                
                // Mover todas las celdas superiores una posición abajo
                for (let fila = filaVacia; fila > 0; fila--) {
                    this.matriz[fila][columna] = this.matriz[fila - 1][columna];
                    this.matriz[fila][columna].fila = fila; // Actualizar posición
                    celdasModificadas.push({ r: fila, c: columna });
                }

                // Generar nueva celda en fila 0 (verificando matriz completa)
                const colorValido = this.generarColorSinMatchEnPosicion(0, columna, COLORES_VALIDOS);
                this.matriz[0][columna] = new Celda(0, columna, colorValido);
                celdasModificadas.push({ r: 0, c: columna });
            }
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