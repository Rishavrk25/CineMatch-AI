const SENSITIVE_KEYS = ['password', 'secret', 'token', 'authorization', 'api_key', 'apikey'];

function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      clean[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info: (msg, meta = null) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[${timestamp}] [INFO] ${msg}`, JSON.stringify(redactSensitiveData(meta)));
    } else {
      console.log(`[${timestamp}] [INFO] ${msg}`);
    }
  },
  warn: (msg, meta = null) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[${timestamp}] [WARN] ${msg}`, JSON.stringify(redactSensitiveData(meta)));
    } else {
      console.warn(`[${timestamp}] [WARN] ${msg}`);
    }
  },
  error: (msg, err = null) => {
    const timestamp = new Date().toISOString();
    if (err) {
      console.error(`[${timestamp}] [ERROR] ${msg}`, err instanceof Error ? err.stack || err.message : err);
    } else {
      console.error(`[${timestamp}] [ERROR] ${msg}`);
    }
  },
  debug: (msg, meta = null) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      if (meta) {
        console.debug(`[${timestamp}] [DEBUG] ${msg}`, JSON.stringify(redactSensitiveData(meta)));
      } else {
        console.debug(`[${timestamp}] [DEBUG] ${msg}`);
      }
    }
  }
};
