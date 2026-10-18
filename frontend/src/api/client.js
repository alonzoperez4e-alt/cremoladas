import axios from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de petición: inyecta Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cremoladas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: manejo de expiración de sesión
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      const code = error.response?.data?.error?.code;
      // Solo ante expiración o token inválido
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'TOKEN_MISSING') {
        localStorage.removeItem('cremoladas_token');
        localStorage.removeItem('cremoladas_user');

        toast.error('Tu sesión expiró. Inicia sesión nuevamente.');

        // Evitar bucle si ya estamos en /login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
