// server/src/config/config.ts
import defaults from "./defaults.json" with { type: "json" };
import dotenv from 'dotenv';

dotenv.config();

const config = {
    ...defaults,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_DATABASE: process.env.DB_DATABASE || 'matchdb',
    PORT: process.env.PORT || 4000,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export default config;