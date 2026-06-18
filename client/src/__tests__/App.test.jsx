import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App.jsx';

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

  it('renders without crashing', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading carbon twin/i)).toBeNull();
    });
    expect(container).toBeTruthy();
  });

  it('redirects to login when not authenticated', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading carbon twin/i)).toBeNull();
    });

    // When no token exists, user should see the login page
    // The app redirects to /login for unauthenticated users
    const loginElements = screen.queryAllByText(/login|sign in|carbon/i);
    expect(loginElements.length).toBeGreaterThan(0);
  });

  it('does not show sidebar or bottom nav when not authenticated', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading carbon twin/i)).toBeNull();
    });

    // Navigation sidebar element should not be present for unauthenticated users
    expect(document.querySelector('aside')).toBeNull();
  });
});
