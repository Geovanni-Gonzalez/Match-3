import { MatchService } from '../../../src/core/services/MatchService.js';
import { Celda } from '../../../src/core/domain/Celda.js';
import { Coordenada } from '../../../src/interfaces.js';

describe('MatchService', () => {
    // Helper para crear un tablero simulado
    const crearTablero = (colores: string[][]): Celda[][] => {
        return colores.map((fila, r) => 
            fila.map((color, c) => new Celda(r, c, color))
        );
    };

    describe('validarCadena', () => {
        it('debe validar un match horizontal válido de 3 celdas', async () => {
            const tablero = crearTablero([
                ['red', 'red', 'red'],
                ['blue', 'green', 'yellow']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 1 },
                { r: 0, c: 2 }
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(true);
            expect(resultado.n).toBe(3);
        });

        it('debe validar un match vertical válido de 3 celdas', async () => {
            const tablero = crearTablero([
                ['blue', 'green', 'yellow'],
                ['blue', 'red', 'red'],
                ['blue', 'yellow', 'green']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 1, c: 0 },
                { r: 2, c: 0 }
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(true);
            expect(resultado.n).toBe(3);
        });

        it('debe validar un match diagonal válido', async () => {
            const tablero = crearTablero([
                ['blue', 'green', 'yellow'],
                ['red', 'blue', 'red'],
                ['green', 'yellow', 'blue']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 1, c: 1 },
                { r: 2, c: 2 }
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(true);
        });

        it('debe rechazar una selección de menos de 3 celdas', async () => {
            const tablero = crearTablero([
                ['red', 'red', 'red']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 1 }
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(false);
        });

        it('debe rechazar celdas de diferentes colores', async () => {
            const tablero = crearTablero([
                ['red', 'blue', 'red']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 1 }, // Diferente color
                { r: 0, c: 2 }
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(false);
        });

        it('debe rechazar celdas no adyacentes', async () => {
            const tablero = crearTablero([
                ['red', 'blue', 'red']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 2 } // Salto de columna
            ];
            // Aunque sean del mismo color (si lo fueran), la adyacencia falla
            // Aquí 'blue' rompe color, pero probemos con mismo color y salto
             const tablero2 = crearTablero([
                ['red', 'blue', 'red']
            ]);
             // Forzamos que sean red, red, red pero seleccionamos 0 y 2
             const tablero3 = crearTablero([
                ['red', 'red', 'red']
            ]);
            const seleccion3: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 2 }
            ];

            const resultado = await MatchService.validarCadena(seleccion3, tablero3);
            expect(resultado.valido).toBe(false);
        });

        it('debe rechazar selecciones que no forman una línea recta (L-shape)', async () => {
            const tablero = crearTablero([
                ['red', 'red', 'blue'],
                ['blue', 'red', 'green']
            ]);
            // Forma de L: (0,0) -> (0,1) -> (1,1)
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 1 },
                { r: 1, c: 1 }
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(false);
        });

        it('debe rechazar si se selecciona la misma celda dos veces', async () => {
            const tablero = crearTablero([
                ['red', 'red', 'red']
            ]);
            const seleccion: Coordenada[] = [
                { r: 0, c: 0 },
                { r: 0, c: 1 },
                { r: 0, c: 0 } // Repetida
            ];

            const resultado = await MatchService.validarCadena(seleccion, tablero);
            expect(resultado.valido).toBe(false);
        });
    });
});
