import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard.jsx';

// Mock user data
const mockUser = {
  id: 'user123',
  name: 'Dashboard Test User',
  email: 'test@example.com',
  onboardingComplete: true,
  currentScore: 3500,
  baselineScore: 5000,
  streak: 7,
  lastLogDate: new Date().toISOString(),
  streakStatus: 'active',
  targetGoal: 3000,
  quizAnswers: {
    transport: { mode: 'car_petrol', weeklyKm: 100 },
    diet: 'omnivore',
    energy: { source: 'mixed', monthlyKwh: 300 },
    shopping: 'average',
    flights: { shortHaul: 2, longHaul: 1 }
  },
  scoreBreakdown: {
    transport: 1092,
    diet: 2500,
    energy: 828,
    shopping: 1200,
    flights: 2130
  },
  dailySnapshots: [
    { date: new Date().toISOString(), score: 3500 }
  ]
};

// Mock auth hook
vi.mock('../context/useAuth.js', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUser: vi.fn(),
  }),
}));

// Mock ScoreContext
const mockFetchDashboardData = vi.fn().mockResolvedValue({
  profile: mockUser,
  history: [],
  summary: { totalActions: 5, totalDelta: -2.5, byCategory: {} }
});

vi.mock('../context/useScore.js', () => ({
  useScore: () => ({
    scoreData: mockUser,
    scoreAnimating: false,
    fetchDashboardData: mockFetchDashboardData,
    summary: { totalActions: 5, totalDelta: -2.5 },
    logAction: vi.fn(),
    actionOptions: {},
    fetchScore: vi.fn(),
    fetchHistory: vi.fn(),
    fetchSummary: vi.fn(),
    lastDelta: 0,
    actionHistory: []
  }),
}));

// Mock Three/Canvas components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="mock-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({ size: { width: 800, height: 600 } }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Text: ({ children }) => <span>{children}</span>,
  Float: ({ children }) => <>{children}</>,
}));

vi.mock('../components/twin/CarbonTwin.jsx', () => ({
  default: () => <div data-testid="carbon-twin-mock">Mock Twin</div>
}));

vi.mock('../components/charts/ScoreBreakdown.jsx', () => ({
  default: () => <div data-testid="score-breakdown-mock">Mock Breakdown</div>
}));

vi.mock('../components/charts/ScoreHistory.jsx', () => ({
  default: () => <div data-testid="score-history-mock">Mock History</div>
}));

vi.mock('../components/ActionLogger.jsx', () => ({
  default: () => <div data-testid="action-logger-mock">Mock Logger</div>
}));

vi.mock('../components/AiCoach.jsx', () => ({
  default: () => <div data-testid="ai-coach-mock">Mock Coach</div>
}));


// Mock API
vi.mock('../api/axios', () => ({
  userAPI: {
    setGoal: vi.fn().mockResolvedValue({ data: { targetGoal: 3000 } }),
    getDashboardSummary: vi.fn(),
  },
}));

describe('Dashboard Page', () => {

  it('renders 3D canvas with screen-reader description', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Carbon Twin')).toBeDefined();
    });

    const canvas = screen.getByRole('img');
    expect(canvas).toBeDefined();
    expect(canvas.getAttribute('aria-label')).toContain('3D Carbon Twin avatar');
  });

  it('calls fetchDashboardData on mount', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(mockFetchDashboardData).toHaveBeenCalled();
    });
  });
});
