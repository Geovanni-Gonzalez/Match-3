// server/src/core/timers/TimerManager.ts
import { Server } from "socket.io";

interface TimerData {
    timeout: NodeJS.Timeout;
    interval?: NodeJS.Timeout;
    expiresAt: number;
}

export class TimerManager {
    private static instance: TimerManager;
    private timers: Map<string, TimerData> = new Map();
    private io: Server | null = null;

    private constructor() {}

    static getInstance() {
        if (!this.instance) {
            this.instance = new TimerManager();
        }
        return this.instance;
    }

    setSocketServer(io: Server) {
        this.io = io;
    }

    startTimer(partidaId: string, seconds: number, onExpire: () => void) {
        this.clearTimer(partidaId);

        const expiresAt = Date.now() + seconds * 1000;

        // Timeout principal
        const timeout = setTimeout(() => {
            onExpire();
            this.clearTimer(partidaId);
        }, seconds * 1000);

        // Intervalo opcional para enviar “ticks” cada segundo
        const interval = setInterval(() => {
            if (!this.io) return;

            const secondsLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));

            this.io.to(partidaId).emit("game:timer_tick", {
                secondsLeft
            });

            if (secondsLeft <= 0) clearInterval(interval);
        }, 1000);

        this.timers.set(partidaId, { timeout, interval, expiresAt });
    }

    clearTimer(partidaId: string) {
        const t = this.timers.get(partidaId);
        if (!t) return;

        clearTimeout(t.timeout);
        if (t.interval) clearInterval(t.interval);

        this.timers.delete(partidaId);
    }

    getRemainingTime(partidaId: string) {
        const t = this.timers.get(partidaId);
        if (!t) return 0;
        return Math.max(0, Math.round((t.expiresAt - Date.now()) / 1000));
    }
}
