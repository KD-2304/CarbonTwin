import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});


// Read a cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

let navigateFn = null;
export const registerNavigate = (nav) => {
  navigateFn = nav;
};

let csrfTokenMemory = null;

// Attach custom security header to every request for CSRF protection
API.interceptors.request.use(config => {
  const csrfCookie = getCookie('ctc_csrf_token');
  const tokenToUse = csrfTokenMemory || csrfCookie || 'true';
  config.headers['X-CTC-Request'] = tokenToUse;
  return config;
});

// Handle responses globally (extract CSRF tokens and handle 401s)
API.interceptors.response.use(
  response => {
    // If the server returns a new CSRF token in the response body, store it
    if (response.data && response.data.csrfToken) {
      csrfTokenMemory = response.data.csrfToken;
    }
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ctc_user');
      csrfTokenMemory = null;
      if (window.location.pathname !== '/login') {
        if (navigateFn) {
          navigateFn('/login');
        } else {
          window.location.href = '/login';
        }
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
  getDashboardSummary: () => API.get('/user/dashboard-summary'),
  setGoal: (targetGoal) => API.put('/user/goal', { targetGoal }),
};

// ─── QUIZ ─────────────────────────────────────────────────────
export const quizAPI = {
  submit: (data) => API.post('/quiz/submit', data),
  getEmissionFactors: () => API.get('/quiz/emission-factors'),
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
