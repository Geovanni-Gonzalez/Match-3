//  server/src/interfaces.ts
export interface Coordenada {
    r: number;
    c: number;
}

export interface Configuracion {
    TIEMPO_VIDA_PARTIDA_MIN: number;
    MATCH_FINITO_LIMITE: number;
    TAMANIO_FILA: number;
    TAMANIO_COLUMNA: number;
    COLORES_VALIDOS: string[];
    TIEMPO_MATCH_ACTIVATE_MS: number;
}