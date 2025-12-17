// Access environment variables exposed by Vite
const env = import.meta.env;

export const API_URL = env.VITE_API_URL || 'http://127.0.0.1:8000/api';
export const APP_NAME = env.VITE_APP_NAME || 'TechParts Pro';
export const IS_DEV = env.DEV;

// Timeout settings (in milliseconds)
export const API_TIMEOUT = 15000;

// Feature Flags (Toggle features on/off easily)
export const FEATURES = {
  USE_MOCK_DATA: false,
  ENABLE_ANALYTICS: true,
};