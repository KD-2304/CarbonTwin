# ⚙️ Setup Guide — Carbon Twin City

This document provides detailed instructions for setting up the Carbon Twin City application for local development, testing, and production deployment.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure the following tools are installed on your system:

| Tool | Version | Purpose |
| --- | --- | --- |
| **Node.js** | v18+ (LTS recommended) | JavaScript runtime |
| **npm** | v9+ (bundled with Node.js) | Package manager |
| **MongoDB** | v6+ (or MongoDB Atlas) | Database |
| **Git** | Latest | Version control |

### Verify installations

```bash
node --version    # Should output v18.x or higher
npm --version     # Should output v9.x or higher
mongod --version  # Should output v6.x or higher (if using local MongoDB)
git --version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd carbon-twin-city
```

### 2. Install All Dependencies

The project uses a monorepo structure with separate `package.json` files for the root, client, and server. Install everything at once:

```bash
npm run install:all
```

This runs `npm install` in:
- **Root** (`./`) — installs `concurrently` for running both servers
- **Server** (`./server`) — installs Express, Mongoose, JWT, Anthropic SDK, etc.
- **Client** (`./client`) — installs React, Vite, Three.js, Tailwind CSS, etc.

> **Note:** Each folder has its own `node_modules/`. The root `node_modules/` contains only `concurrently` and is required for `npm run dev`. Do **not** delete it.

---

## Environment Variables

### Server Configuration

Copy the example environment file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:

```env
# Server port (default: 5000)
PORT=5000

# MongoDB connection string
# Local: mongodb://localhost:27017/carbon-twin-city
# Atlas: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/carbon-twin-city
MONGO_URI=mongodb://localhost:27017/carbon-twin-city

# Secret key for JWT token signing (use a strong random string in production)
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Gemini API key for AI coaching feature
# Get yours at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### Variable Reference

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | API server port |
| `MONGO_URI` | **Yes** | `mongodb://localhost:27017/carbon-twin-city` | MongoDB connection URI |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWT tokens |
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key for AI features |

> **⚠️ Important:** Never commit `.env` files to version control. The `.gitignore` is already configured to exclude them.

---

## Database Setup

### Option A: Local MongoDB

1. **Install MongoDB Community Edition** — follow the [official guide](https://www.mongodb.com/docs/manual/installation/)
2. **Start the MongoDB service:**

   ```bash
   # Windows
   net start MongoDB

   # macOS (Homebrew)
   brew services start mongodb-community

   # Linux (systemd)
   sudo systemctl start mongod
   ```

3. **Verify connection:**

   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Go to **Database Access** → Create a database user
4. Go to **Network Access** → Add your IP address (or `0.0.0.0/0` for development)
5. Go to **Database** → **Connect** → **Drivers** → Copy the connection string
6. Paste the connection string into `server/.env` as `MONGO_URI`

### Seed the Database (Optional)

Populate the database with sample users, actions, and reports:

```bash
npm run seed
```

This runs `server/seed.js` which creates demo data for testing the application.

---

## Running the Application

### Development Mode (Recommended)

Start both client and server concurrently:

```bash
npm run dev
```

| Service | URL | Description |
| --- | --- | --- |
| Client (Vite) | http://localhost:5173 | React frontend with HMR |
| Server (Express) | http://localhost:5000 | API backend with `--watch` |

The Vite dev server automatically proxies `/api/*` requests to the Express server.

### Run Services Individually

```bash
# Start only the API server
npm run server

# Start only the client
npm run client
```

### Verify the Server

```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Running Tests

The test suite is located in the `tests/` directory. See [tests/README.md](./tests/README.md) for full documentation.

### Quick Test Run

```bash
# Run all tests
npm test

# Run only server tests
npm run test:server

# Run only client tests
npm run test:client

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── client/           # Frontend component tests
│   └── App.test.jsx  # App component rendering tests
├── server/           # Backend API tests
│   ├── auth.test.js  # Authentication endpoint tests
│   └── health.test.js # Health check endpoint test
└── README.md         # Test documentation
```

---

## Building for Production

### Build the Client

```bash
npm run build
```

This creates an optimized production bundle in `client/dist/`.

### Serve the Production Build

You can preview the production build locally:

```bash
cd client
npm run preview
```

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, unique `JWT_SECRET`
- [ ] Use MongoDB Atlas or a managed MongoDB instance
- [ ] Set a valid `GEMINI_API_KEY`
- [ ] Configure CORS origin in `server/index.js` to match your production domain
- [ ] Serve `client/dist/` via a static file server or CDN (e.g., Vercel, Netlify)
- [ ] Deploy the server to a Node.js hosting platform (e.g., Render, Railway, Fly.io)
- [ ] Enable HTTPS on both frontend and backend

---

## Deployment

### Option A: Separate Deployments (Recommended)

#### Frontend → Vercel / Netlify

1. Connect your repo to Vercel or Netlify
2. Set the root directory to `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable `VITE_API_URL` to your backend URL

#### Backend → Render / Railway

1. Connect your repo
2. Set the root directory to `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add all environment variables from `.env`

### Option B: Single Server Deployment

1. Build the client: `npm run build`
2. Configure Express to serve `client/dist/` as static files
3. Deploy the combined app to a Node.js host

---

## Troubleshooting

### Common Issues

#### `ECONNREFUSED` when starting the app
MongoDB is not running. Start it:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Port 5000 already in use
Another process is using port 5000. Either kill it or change the port in `server/.env`:
```bash
# Find the process (Windows)
netstat -ano | findstr :5000

# Kill it
taskkill /PID <pid> /F
```

#### `MODULE_NOT_FOUND` errors
Dependencies may be missing. Reinstall:
```bash
npm run install:all
```

#### Client can't reach the API
The Vite proxy only works in development. Ensure both servers are running via `npm run dev`. Check that the server is healthy:
```bash
curl http://localhost:5000/api/health
```

#### Gemini API errors
Verify your API key is correct and has available quota at [aistudio.google.com](https://aistudio.google.com/apikey).

---

## Need Help?

- Check the [README.md](./README.md) for an overview of the project
- Review the [tests/README.md](./tests/README.md) for testing documentation
- Open an issue on the repository for bugs or feature requests
