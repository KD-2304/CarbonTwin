import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

// Mock framer-motion to avoid animation-related test issues
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

// Mock Three.js components to avoid canvas issues in JSDOM
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="three-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({ size: { width: 800, height: 600 } }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Environment: () => null,
  Float: ({ children }) => <>{children}</>,
  Text: ({ children }) => <span>{children}</span>,
}));

// Mock custom WebGL canvas components to prevent rendering R3F elements in DOM
vi.mock('../components/twin/CarbonTwin', () => ({
  default: () => <div data-testid="carbon-twin">Mock Carbon Twin</div>
}));

vi.mock('../components/city/CarbonCity', () => ({
  default: () => <div data-testid="carbon-city">Mock Carbon City</div>
}));

vi.mock('../components/landing/InteractiveEcoGlobe', () => ({
  default: () => <div data-testid="interactive-eco-globe">Mock Eco Globe</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('redirects to login when not authenticated', () => {
    render(<App />);

    // When no token exists, user should see the login page
    // The app redirects to /login for unauthenticated users
    const loginElements = screen.queryAllByText(/login|sign in|carbon/i);
    expect(loginElements.length).toBeGreaterThan(0);
  });

  it('does not show sidebar or bottom nav when not authenticated', () => {
    render(<App />);

    // Navigation sidebar element should not be present for unauthenticated users
    expect(document.querySelector('aside')).toBeNull();
  });
});
