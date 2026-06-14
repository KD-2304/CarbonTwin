import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ActionLogger from '../components/ActionLogger.jsx';
import Simulator from '../pages/Simulator.jsx';
import { ScoreProvider } from '../context/ScoreContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

// Mock AuthContext
const mockUser = {
  id: 'user123',
  name: 'Test Green User',
  email: 'test@example.com',
  onboardingComplete: true,
  currentScore: 3000,
  streak: 5,
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
  }
};

vi.mock('../context/AuthContext.jsx', () => {
  return {
    useAuth: () => ({
      user: mockUser,
      refreshUser: vi.fn(),
    }),
    AuthProvider: ({ children }) => <>{children}</>
  };
});

// Mock ScoreContext
const mockLogAction = vi.fn().mockResolvedValue({
  action: { co2Delta: -0.5, label: 'Vegan meal' },
});

vi.mock('../context/ScoreContext.jsx', async () => {
  const { ACTION_OPTIONS } = await import('../utils/emissionFactors');
  return {
    useScore: () => ({
      logAction: mockLogAction,
      scoreData: { currentScore: 3000, scoreBreakdown: mockUser.scoreBreakdown },
      scoreAnimating: false,
      fetchScore: vi.fn(),
      fetchHistory: vi.fn(),
      fetchSummary: vi.fn(),
      summary: { totalDelta: -5, totalActions: 3 },
      actionOptions: ACTION_OPTIONS
    }),
    ScoreProvider: ({ children }) => <>{children}</>
  };
});

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

// Mock framer-motion
vi.mock('framer-motion', () => {
  const motionMock = new Proxy({}, {
    get: (target, prop) => {
      return ({ children, ...props }) => {
        const { initial, animate, exit, transition, whileHover, whileTap, variants, ...domProps } = props;
        const Component = prop;
        return <Component {...domProps}>{children}</Component>;
      };
    }
  });
  return {
    AnimatePresence: ({ children }) => children,
    motion: motionMock
  };
});

// Mock axios API calls to avoid actual network errors in tests
vi.mock('../api/axios', () => ({
  simulatorAPI: {
    calculate: vi.fn().mockResolvedValue({
      data: {
        currentScore: 3000,
        simulatedScore: 2800,
        savings: 200,
        currentBreakdown: { transport: 1000, diet: 1000, energy: 500, shopping: 300, flights: 200 },
        simulatedBreakdown: { transport: 800, diet: 1000, energy: 500, shopping: 300, flights: 200 },
        equivalencies: { treesPlanted: 10, kmNotDriven: 100, smartphonesCharged: 50, showers: 5 }
      }
    })
  },
  quizAPI: {
    getEmissionFactors: vi.fn().mockResolvedValue({
      data: {}
    })
  }
}));

describe('ActionLogger Component', () => {
  beforeEach(() => {
    mockLogAction.mockClear();
  });

  it('renders standard ActionLogger categories', () => {
    render(<ActionLogger />);
    expect(screen.getByText('Log Today')).toBeDefined();
    expect(screen.getByText('Transport')).toBeDefined();
    expect(screen.getByText('Meals')).toBeDefined();
  });

  it('triggers logAction when an action button is clicked', async () => {
    render(<ActionLogger />);
    
    // Find and click the 'Worked from home' action button
    const wfhButton = screen.getByText('Worked from home');
    expect(wfhButton).toBeDefined();
    
    fireEvent.click(wfhButton);
    
    await waitFor(() => {
      expect(mockLogAction).toHaveBeenCalledWith({
        category: 'transport',
        action: 'work_from_home',
        km: undefined,
        notes: ''
      });
    });
  });

  it('updates display to show meal options when Meals category is selected', async () => {
    render(<ActionLogger />);
    
    const mealsTab = screen.getByText('Meals');
    fireEvent.click(mealsTab);
    
    expect(screen.getByText('Vegan meal')).toBeDefined();
    expect(screen.getByText('Meat meal')).toBeDefined();
  });
});

describe('Simulator Page', () => {
  it('renders simulator page with target score', async () => {
    render(<Simulator />);
    expect(screen.getByText('What-If Simulator')).toBeDefined();
    expect(screen.getByText('Scenario Lab')).toBeDefined();
    expect(screen.getByText('Score Projection')).toBeDefined();

    // Wait for simulated calculate API response state update
    await waitFor(() => {
      expect(screen.getByText('No annual savings yet.')).toBeDefined();
    });
  });

  it('toggles lifestyle switches', async () => {
    render(<Simulator />);

    // Wait for initial render state resolution
    await waitFor(() => {
      expect(screen.getByText('No annual savings yet.')).toBeDefined();
    });
    
    // Toggle Switch to renewable energy
    const renewableButton = screen.getByText('Switch to renewable energy');
    expect(renewableButton).toBeDefined();
    
    await act(async () => {
      fireEvent.click(renewableButton);
    });
    
    // Verified simulated change triggers re-calculation
    await waitFor(() => {
      expect(screen.getByText('1 selected')).toBeDefined();
    });
  });
});
