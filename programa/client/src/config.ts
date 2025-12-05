/**
 * @file config.ts
 * @description Configuración inteligente del cliente.
 * 
 * Detecta automáticamente si el backend está disponible en localhost o ngrok
 * y configura la URL apropiada sin necesidad de cambiar el .env manualmente.
 */

/** URL del backend en localhost */
const LOCALHOST_URL = 'http://localhost:4000';

/** Variable de entorno para URL de ngrok (opcional) */
const NGROK_URL = process.env.REACT_APP_NGROK_URL || '';

/** Tiempo máximo para verificar conexión (ms) */
const HEALTH_CHECK_TIMEOUT = 2000;

/**
 * Variable que almacena la URL del backend detectada.
 * Se inicializa con localhost y se actualiza si ngrok está disponible.
 */
let detectedApiUrl = LOCALHOST_URL;

/**
 * Verifica si un servidor está disponible haciendo un health check.
 * @param url - URL base del servidor a verificar.
 * @returns Promise<boolean> - true si el servidor responde.
 */
const checkServerHealth = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Detecta automáticamente qué backend usar.
 * Prioridad:
 * 1. Si estamos accediendo desde ngrok, usar ngrok backend
 * 2. Si localhost está disponible, usar localhost
 * 3. Si ngrok está configurado y disponible, usar ngrok
 * 4. Fallback a localhost
 */
export const detectBackendUrl = async (): Promise<string> => {
  const isAccessedViaNgrok = typeof window !== 'undefined' &&
    window.location.hostname.includes('ngrok');

  // Si el cliente se accede via ngrok, necesitamos usar el backend de ngrok
  if (isAccessedViaNgrok && NGROK_URL) {
    console.log('[Config] Cliente accedido via ngrok, usando backend ngrok');
    detectedApiUrl = NGROK_URL;
    return NGROK_URL;
  }

  // Intentar localhost primero
  console.log('[Config] Verificando localhost...');
  const localhostAvailable = await checkServerHealth(LOCALHOST_URL);

  if (localhostAvailable) {
    console.log('[Config] ✅ Localhost disponible');
    detectedApiUrl = LOCALHOST_URL;
    return LOCALHOST_URL;
  }

  // Si localhost no está disponible y hay URL de ngrok, intentar ngrok
  if (NGROK_URL) {
    console.log('[Config] Localhost no disponible, verificando ngrok...');
    const ngrokAvailable = await checkServerHealth(NGROK_URL);

    if (ngrokAvailable) {
      console.log('[Config] ✅ Ngrok disponible');
      detectedApiUrl = NGROK_URL;
      return NGROK_URL;
    }
  }

  // Fallback a localhost (aunque no responda, para mostrar error apropiado)
  console.log('[Config] ⚠️ Ningún servidor disponible, usando localhost por defecto');
  detectedApiUrl = LOCALHOST_URL;
  return LOCALHOST_URL;
};

/**
 * Obtiene la URL del API actual (sin async).
 * Usar después de que detectBackendUrl() haya sido llamado.
 */
export const getApiUrl = (): string => detectedApiUrl;

/**
 * URL del backend - valor inicial.
 * Se recomienda usar detectBackendUrl() al iniciar la app.
 */
export const API_URL = LOCALHOST_URL;

// Log inicial
// if (typeof window !== 'undefined') {
//   console.log('[Config] Inicializando... URL por defecto:', LOCALHOST_URL);
//   if (NGROK_URL) {
//     console.log('[Config] URL ngrok configurada:', NGROK_URL);
//   }
// }
