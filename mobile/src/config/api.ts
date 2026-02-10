export const API_BASE_URL = 'http://localhost:8080/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',

  // Signalements endpoints
  SIGNALEMENTS: '/signalements',
  SIGNALEMENT_BY_ID: (id: string) => `/signalements/${id}`,
  SIGNALEMENT_STATUS: (id: string) => `/signalements/${id}/status`,

  // Stats endpoints
  STATS: '/stats',
  STATS_DELAYS: '/stats/delays',
};
