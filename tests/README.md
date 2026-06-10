# 🧪 Tests — Carbon Twin City

This directory contains the test suite for the Carbon Twin City application. Tests are organized by layer (server / client) and cover API endpoints, business logic, and UI components.

---

## Directory Structure

```
tests/
├── client/                    # Frontend utility tests
│   └── scoreCalculator.test.js # Score calculation utility tests
├── server/                    # Backend tests
│   ├── auth.test.js           # Authentication endpoints (register, login)
│   ├── health.test.js         # Health check endpoint
│   └── scoreService.test.js   # Score service business logic tests
└── README.md                  # ← You are here

client/src/__tests__/          # Frontend component tests (co-located for React dep resolution)
└── App.test.jsx               # App component rendering tests
```

---

## Prerequisites

Install test dependencies before running:

```bash
# From the project root
npm run install:all
```

The following test frameworks are used:

| Layer | Framework | Description |
| --- | --- | --- |
| Server | **Jest** + **Supertest** | HTTP endpoint testing with in-memory MongoDB |
| Client | **Vitest** + **React Testing Library** | Component rendering and unit tests |

---

## Running Tests

### All Tests

```bash
npm test
```

### Server Tests Only

```bash
npm run test:server
```

### Client Tests Only

```bash
npm run test:client
```

### Watch Mode

```bash
npm run test:watch
```

---

## Test Coverage

### Server Tests

| Test File | What It Covers |
| --- | --- |
| `health.test.js` | `GET /api/health` — returns `{ status: "ok" }` |
| `auth.test.js` | `POST /api/auth/register` — validation, duplicate emails, successful registration |
| | `POST /api/auth/login` — missing fields, wrong password, successful login |
| `scoreService.test.js` | `calculateBaselineScore()` — baseline carbon footprint from quiz answers |
| | `calculateActionDelta()` — CO₂ delta for daily actions |
| | `updateStreak()` — streak continuation and break logic |
| | `getEquivalencies()` — real-world CO₂ equivalencies |

### Client Tests

| Test File | What It Covers |
| --- | --- |
| `App.test.jsx` (in `client/src/__tests__/`) | App component renders without crashing |
| | Shows loading spinner initially |
| | Redirects unauthenticated users to login |
| `scoreCalculator.test.js` | `calculateBaselineScore()` — client-side baseline calculation |
| | `getScoreColor()` — color mapping for score ranges |
| | `getScoreLabel()` — label mapping for score ranges |
| | `getEquivalencies()` — CO₂ equivalency conversions |
| | `formatNumber()` — number formatting |

---

## Writing New Tests

### Server Test Template

```javascript
const request = require('supertest');
const app = require('../../server/index');

describe('Your Feature', () => {
  it('should do something', async () => {
    const res = await request(app).get('/api/your-endpoint');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('yourField');
  });
});
```

### Client Test Template

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../../client/src/components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## Notes

- **MongoDB**: Server tests require a running MongoDB instance (local or Atlas). Tests use the same `MONGO_URI` from `server/.env`.
- **Environment**: Ensure `server/.env` is configured before running server tests.
- **Isolation**: Each test suite should clean up any data it creates to avoid test pollution.
