import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080',
});

// Rotas que NÃO devem receber Authorization: evita que um token
// obsoleto no SecureStore contamine login/registro/recuperação.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

api.interceptors.request.use(async (config) => {
  const url = config.url ?? '';
  if (PUBLIC_AUTH_PATHS.some((p) => url.includes(p))) {
    return config;
  }
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se um endpoint autenticado devolver 401 e houver token local,
// o token está inválido — limpa para não contaminar as próximas requisições.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?._skipAuthCleanup) {
      // Não limpa em logout explícito (que já trata o erro).
      // Importação dinâmica para evitar ciclo api ↔ auth.
      const { logout } = await import('./auth');
      await logout();
    }
    return Promise.reject(error);
  }
);

export default api;
