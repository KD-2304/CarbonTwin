import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});


// Attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('ctc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ctc_token');
      localStorage.removeItem('ctc_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
};

// ─── USER ─────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => API.get('/user/profile'),
  updateProfile: (data) => API.put('/user/profile', data),
  getScore: () => API.get('/user/score'),
};

// ─── QUIZ ─────────────────────────────────────────────────────
export const quizAPI = {
  submit: (data) => API.post('/quiz/submit', data),
};

// ─── ACTIONS ──────────────────────────────────────────────────
export const actionsAPI = {
  log: (data) => API.post('/actions/log', data),
  getHistory: (days = 7) => API.get(`/actions/history?days=${days}`),
  getSummary: () => API.get('/actions/summary'),
};

// ─── COMMUNITY ────────────────────────────────────────────────
export const communityAPI = {
  getStats: () => API.get('/community/stats'),
  getLeaderboard: () => API.get('/community/leaderboard'),
};

// ─── AI ───────────────────────────────────────────────────────
export const aiAPI = {
  getWeeklyInsight: () => API.post('/ai/weekly-insight'),
  chat: (message) => API.post('/ai/chat', { message }),
  generateWeeklyReport: () => API.post('/ai/weekly-report'),
  getReports: () => API.get('/ai/reports'),
};

// ─── SIMULATOR ────────────────────────────────────────────────
export const simulatorAPI = {
  calculate: (data) => API.post('/simulator/calculate', data),
};

export default API;
