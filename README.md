# 🌍 Carbon Twin City

> Track and reduce your carbon footprint through a personalized 3D avatar and shared community city.

Carbon Twin City is a full-stack web application that gamifies carbon footprint tracking. Users log daily actions, receive AI-powered coaching, compete on leaderboards, and watch a shared 3D city evolve based on the community's collective environmental impact.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| **Dashboard** | Real-time overview of your carbon score, daily actions, and weekly trends |
| **3D Twin City** | Interactive Three.js city that reflects the community's carbon footprint |
| **AI Coach** | Anthropic Claude-powered personalized sustainability tips |
| **Action Logger** | Log daily eco-actions (transport, diet, energy) and earn points |
| **Simulator** | "What-if" scenario simulator to see the impact of lifestyle changes |
| **Leaderboard** | Community rankings to encourage friendly competition |
| **Weekly Reports** | Auto-generated reports tracking your progress over time |
| **Onboarding Quiz** | Personalized onboarding that calibrates your baseline carbon score |
| **Auth System** | JWT-based authentication with secure password hashing |

---

## 🛠️ Tech Stack

### Client
- **React 19** with Vite 8
- **React Three Fiber** + **Drei** — 3D city rendering
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Page transitions and micro-animations
- **Recharts** — Data visualization for reports and dashboards
- **React Router v7** — Client-side routing
- **Axios** — HTTP client with interceptors

### Server
- **Node.js** with **Express 4**
- **MongoDB** via **Mongoose 8**
- **Anthropic AI SDK** — AI-powered coaching
- **JWT** — Stateless authentication
- **bcryptjs** — Password hashing

### Dev Tools
- **Concurrently** — Run client and server in parallel
- **ESLint** — Linting for the client

---

## 📁 Project Structure

```
carbon-twin-city/
├── client/                    # React + Vite frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── api/               # Axios instance & interceptors
│   │   ├── assets/            # Images, icons
│   │   ├── components/
│   │   │   ├── charts/        # Recharts chart components
│   │   │   ├── city/          # 3D city scene components
│   │   │   ├── twin/          # Twin avatar components
│   │   │   ├── ui/            # Shared UI (Sidebar, BottomNav, ProtectedRoute)
│   │   │   ├── ActionLogger.jsx
│   │   │   └── AiCoach.jsx
│   │   ├── context/           # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ScoreContext.jsx
│   │   ├── pages/             # Route-level page components
│   │   │   ├── City.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Simulator.jsx
│   │   ├── utils/             # Emission factors & score calculator
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # Express API backend
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── Action.js          # Logged eco-action schema
│   │   ├── User.js            # User profile & carbon data schema
│   │   └── WeeklyReport.js    # Weekly report schema
│   ├── routes/
│   │   ├── actions.js         # CRUD for carbon actions
│   │   ├── ai.js              # AI coaching endpoint
│   │   ├── auth.js            # Login / Register
│   │   ├── community.js       # Leaderboard & community data
│   │   ├── quiz.js            # Onboarding quiz
│   │   ├── simulator.js       # What-if scenario API
│   │   └── user.js            # User profile management
│   ├── services/
│   │   ├── aiService.js       # Anthropic Claude integration
│   │   └── scoreService.js    # Carbon score computation
│   ├── index.js               # Server entry point
│   ├── seed.js                # Database seed script
│   ├── .env.example           # Environment variable template
│   └── package.json
│
├── tests/                     # Test suite (see SETUP.md for details)
│   ├── client/                # Frontend tests
│   │   └── App.test.jsx
│   ├── server/                # Backend tests
│   │   ├── auth.test.js
│   │   └── health.test.js
│   └── README.md              # Test documentation
│
├── package.json               # Root workspace (concurrently)
├── README.md                  # ← You are here
└── SETUP.md                   # Detailed setup & deployment guide
```

---

## 🚀 Quick Start

> For the full setup guide (MongoDB, environment variables, deployment), see [SETUP.md](./SETUP.md).

```bash
# 1. Clone the repository
git clone <repository-url>
cd carbon-twin-city

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, and Anthropic API key

# 4. (Optional) Seed the database with sample data
npm run seed

# 5. Start the development servers
npm run dev
```

The client runs on **http://localhost:5173** and the server on **http://localhost:5000**.

---

## 📜 Available Scripts

Run these from the **project root**:

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `npm run dev` | Start both client & server concurrently |
| `server` | `npm run server` | Start only the API server (with `--watch`) |
| `client` | `npm run client` | Start only the Vite dev server |
| `install:all` | `npm run install:all` | Install dependencies for root, server, and client |
| `seed` | `npm run seed` | Seed MongoDB with sample data |
| `build` | `npm run build` | Build the client for production |

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | ✗ | Health check |
| `POST` | `/api/auth/register` | ✗ | Register a new user |
| `POST` | `/api/auth/login` | ✗ | Login and receive JWT |
| `GET` | `/api/user/profile` | ✓ | Get user profile |
| `PUT` | `/api/user/profile` | ✓ | Update user profile |
| `GET` | `/api/actions` | ✓ | Get logged actions |
| `POST` | `/api/actions` | ✓ | Log a new eco-action |
| `POST` | `/api/quiz/submit` | ✓ | Submit onboarding quiz |
| `POST` | `/api/ai/coach` | ✓ | Get AI coaching advice |
| `GET` | `/api/community/leaderboard` | ✓ | Community leaderboard |
| `POST` | `/api/simulator/run` | ✓ | Run what-if simulation |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add new feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and not licensed for public distribution.
