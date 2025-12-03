import * as fs from 'fs';
import * as path from 'path';

interface EstadisticaPartida {
    partidaId: string;
    ganador: string;
    puntaje: number;
    tematica: string;
    tiempoInvertidoSegundos: number;
    fecha: string;
}

export class DBManager {
    private static readonly ESTADISTICAS_FILE = path.join(__dirname, '../../data/estadisticas.json');

    public static async guardarEstadisticas(partidaId: string, jugadorId: number, puntaje: number, esGanador: boolean): Promise<void> {
        console.log(`[DB] Guardando estadísticas para Jugador ${jugadorId} en Partida ${partidaId}. Puntaje: ${puntaje}, Ganador: ${esGanador}`);
    }

    public static async guardarEstadisticasPartida(
        partidaId: string,
        ganador: string,
        puntaje: number,
        tematica: string,
        tiempoInvertidoSegundos: number
    ): Promise<void> {
        try {
            // Crear directorio si no existe
            const dataDir = path.dirname(this.ESTADISTICAS_FILE);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Leer estadísticas existentes
            let estadisticas: EstadisticaPartida[] = [];
            if (fs.existsSync(this.ESTADISTICAS_FILE)) {
                const contenido = fs.readFileSync(this.ESTADISTICAS_FILE, 'utf-8');
                estadisticas = JSON.parse(contenido);
            }

            // Agregar nueva estadística
            const fechaActual = new Date();
            const dia = String(fechaActual.getDate()).padStart(2, '0');
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const anio = fechaActual.getFullYear();
            const fechaFormateada = `${dia}-${mes}-${anio}`;
            
            const nuevaEstadistica: EstadisticaPartida = {
                partidaId,
                ganador,
                puntaje,
                tematica,
                tiempoInvertidoSegundos,
                fecha: fechaFormateada
            };

            estadisticas.push(nuevaEstadistica);

            // Guardar en archivo
            fs.writeFileSync(this.ESTADISTICAS_FILE, JSON.stringify(estadisticas, null, 2), 'utf-8');
            
            console.log(`[DB] ✅ Estadísticas guardadas en JSON: Partida ${partidaId}, Ganador: ${ganador}, Puntaje: ${puntaje}`);
        } catch (error) {
            console.error(`[DB] ❌ Error al guardar estadísticas:`, error);
        }
    }

    public static async obtenerEstadisticas(): Promise<EstadisticaPartida[]> {
        try {
            if (fs.existsSync(this.ESTADISTICAS_FILE)) {
                const contenido = fs.readFileSync(this.ESTADISTICAS_FILE, 'utf-8');
                return JSON.parse(contenido);
            }
            return [];
        } catch (error) {
            console.error(`[DB] ❌ Error al leer estadísticas:`, error);
            return [];
        }
    }
}