// server/src/config/config.ts
import defaults from './defaults.json';


export type Configuracion = typeof defaults;


const config: Configuracion = defaults;


export default config;