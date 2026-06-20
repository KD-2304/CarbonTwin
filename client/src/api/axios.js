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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle responses globally (extract CSRF tokens and handle 401s)
API.interceptors.response.use(
  response => {
    // If the server returns a new CSRF token in the response body, store it
    if (response.data && response.data.csrfToken) {
      csrfTokenMemory = response.data.csrfToken;
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Detect access token expiration and trigger refresh
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return API(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          (import.meta.env.VITE_API_URL || '/api') + '/auth/refresh',
          {},
          { withCredentials: true }
        );

        if (data.csrfToken) {
          csrfTokenMemory = data.csrfToken;
        }

        processQueue(null);
        isRefreshing = false;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('ctc_user');
        csrfTokenMemory = null;
        if (window.location.pathname !== '/login') {
          if (navigateFn) {
            navigateFn('/login');
          } else {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Other 401 errors (unauthorized, invalid token, revoked session, etc.)
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
  getHistory: (days = 7, limit = 20, cursor = '') => API.get(`/actions/history?days=${days}&limit=${limit}&cursor=${cursor}`),
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
