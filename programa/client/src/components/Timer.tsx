import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export const Timer = ({ idPartida }: { idPartida: string }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Mantiene el count local
    const startLocalTimer = (initialSeconds: number) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeLeft(initialSeconds);

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
    };

    useEffect(() => {
        // Tick inicial al entrar
        socket.on("game:timer_tick", ({ secondsLeft }) => {
            setTimeLeft(prev => {
                // Corrección automática si hay drift
                if (Math.abs(prev - secondsLeft) > 1) {
                    startLocalTimer(secondsLeft);
                    return secondsLeft;
                }
                return prev;
            });
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            socket.off("match:timer_tick");
        };
    }, [idPartida]);

    return (
        <div style={{ fontSize: 32, fontWeight: "bold" }}>
            Tiempo restante: {timeLeft}s
        </div>
    );
};
