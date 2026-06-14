<div align="center">
  <img src="./logo.svg" alt="Carbon Twin City Logo" width="120" height="120" />

  # 🌍 Carbon Twin City

  > Track, visualize, and reduce your carbon footprint through a personalized 3D avatar and a shared community city.

  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
  [![React Version](https://img.shields.io/badge/react-19.x-blue.svg?style=for-the-badge&logo=react)](https://react.dev)
  [![Vite Version](https://img.shields.io/badge/vite-8.x-64748b.svg?style=for-the-badge&logo=vite)](https://vite.dev)
  [![Tailwind CSS](https://img.shields.io/badge/tailwind-v4-38bdf8.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
  [![License](https://img.shields.io/badge/license-private-red.svg?style=for-the-badge)](https://choosealicense.com/)

  [Key Features](#-key-features) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Architecture](#%EF%B8%8F-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-endpoints) • [Contributing](#-contributing)
</div>

---

## 🚀 Key Features

*   **📊 Personal Carbon Dashboard:** A real-time hub tracking your annual carbon footprint, consecutive log streaks, and weekly emission savings.
*   **🎮 3D Twin City:** An interactive 3D virtual world rendered via Three.js (React Three Fiber) reflecting your community's collective ecological health.
*   **🤖 AI Coach:** Personalized, actionable tips generated dynamically by the Google Gemini API to target your highest emission areas.
*   **📝 Daily Action Logger:** Quick-log eco-conscious daily routines (diet, travel, home energy, and shopping) and witness instant score feedback.
*   **🧪 What-If Simulator:** A scenario testing laboratory projecting potential carbon savings before committing to lifestyle modifications.
*   **🏆 Community Leaderboard:** Friendly competition rankings tracking weekly carbon reduction achievements and top streaks.
*   **📋 Personalized Onboarding:** An interactive baseline quiz analyzing lifestyle habits to calibrate initial footprints.

---

## 🛠️ Tech Stack

### Client (Frontend)
*   **React 19 & Vite 8:** Next-generation rendering speeds and Hot Module Replacement (HMR).
*   **React Three Fiber (R3F) & Drei:** WebGL-based Three.js rendering for the 3D twin avatar and community city.
*   **Tailwind CSS v4 & Framer Motion:** Modern utility-first styling combined with fluent transition micro-animations.
*   **Recharts:** Beautiful, responsive SVG charts tracking score progressions.
*   **React Router v7:** Modern, declaratively styled application shell routing.

### Server (Backend)
*   **Node.js & Express 4:** Fast, minimalist backend web framework.
*   **MongoDB & Mongoose 8:** Document-based database configuration supporting indexed performance lookups.
*   **Google Gemini SDK:** Dynamic, prompt-engineered AI coaching and insight synthesis.
*   **JWT & Bcryptjs:** Stateless authentication architecture utilizing secure, HttpOnly, SameSite-secured token cookies.

---

## 🖥️ Architecture

```mermaid
graph TD
    subgraph Client [Client - React 19 / Vite]
        A[App Shell] --> B[Dashboard]
        A --> C[3D Twin City]
        A --> D[What-If Simulator]
        A --> E[AI Coach Chat]
        F[Axios Interceptors] -- JWT / X-CTC-Request Header --> G[Express API]
    end

    subgraph Server [Backend - Node.js / Express]
        G --> H[Auth Middleware]
        H --> I[Score Service]
        H --> J[AI Service]
        I --> K[(MongoDB / Mongoose)]
        J -- Google Gemini API Key --> L[Google Gemini API]
    end
    
    classDef client fill:#7cb77f,stroke:#3d7c40,stroke-width:1px,color:#ffffff;
    classDef server fill:#4db8a4,stroke:#339985,stroke-width:1px,color:#ffffff;
    classDef external fill:#e5a548,stroke:#c88a2e,stroke-width:1px,color:#ffffff;
    
    class A,B,C,D,E,F client;
    class G,H,I,K server;
    class L external;
```

---

## 🚦 Getting Started

### Prerequisites

Verify that Node.js (v18+) and MongoDB are installed on your environment:
```bash
node --version
npm --version
mongod --version # If running a local DB
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd carbon-twin-city
   ```

2. **Install all workspace dependencies:**
   This command installs node packages for the **Root**, **Server**, and **Client** directories concurrently:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables:**
   Copy the template environment file in the `server` directory:
   ```bash
   cp server/.env.example server/.env
   ```
   Open `server/.env` and update configuration secrets:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/carbon-twin-city
   JWT_SECRET=your_super_secure_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
   CLIENT_URL=http://localhost:5173
   ```

4. **Seed Database (Optional):**
   Seed your database collections with mock users, metrics, and logs for immediate testing:
   ```bash
   npm run seed
   ```

5. **Start Development Servers:**
   Launch both backend (port 5000) and frontend (port 5173) in watch mode:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

Automated test suites utilize **Jest** for API routes/services and **Vitest** + **React Testing Library** for components.

Run all tests from the root directory:
```bash
npm test          # Run all frontend & backend tests
npm run test:server # Run API endpoint and logic tests
npm run test:client # Run React UI component and calculator tests
```

---

## 🔌 API Endpoints

All backend routes are prefixed with `/api`. Modifying endpoints require the `X-CTC-Request: true` header for CSRF protection.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | ✗ | Create a new user profile & issue token cookie |
| `POST` | `/api/auth/login` | ✗ | Login credentials validation |
| `POST` | `/api/auth/logout` | ✗ | Clear token session cookie |
| `GET` | `/api/user/profile` | ✓ | Retrieve authenticated profile |
| `PUT` | `/api/user/profile` | ✓ | Update name, city, or location details |
| `GET` | `/api/actions/history` | ✓ | Fetch action logs history (default: 7 days) |
| `GET` | `/api/actions/summary` | ✓ | Fetch weekly action totals and category delta sums |
| `POST` | `/api/actions/log` | ✓ | Log a new eco-action (Diet, Travel, Home, Shopping) |
| `POST` | `/api/quiz/submit` | ✓ | Submit onboarding survey to compute baseline |
| `POST` | `/api/ai/coach` | ✓ | Chat dynamically with Gemini Carbon Coach |
| `GET` | `/api/community/leaderboard`| ✓ | Retrieve top reducers and streak achievers |
| `POST` | `/api/simulator/calculate` | ✓ | Run projections on modified lifestyle answers |

---

## 🤝 Contributing

We welcome contributions to help improve Carbon Twin City! To contribute:

1. **Fork** the repository and create your feature branch:
   ```bash
   git checkout -b feat/your-awesome-feature
   ```
2. Follow our commit naming convention (based on Angular Commit Guidelines):
   - `feat: add carbon badges`
   - `fix: resolve auth cookie crash`
   - `docs: update deployment links`
3. Commit and push your changes:
   ```bash
   git commit -m "feat: your descriptive commit message"
   git push origin feat/your-awesome-feature
   ```
4. Open a **Pull Request** explaining your implementation details.

---

## 📄 License

MIT License
