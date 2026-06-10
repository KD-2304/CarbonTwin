import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@src/App.jsx';

// Mock framer-motion to avoid animation-related test issues
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
    p: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...domProps } = props;
      return <p {...domProps}>{children}</p>;
    },
    span: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...domProps } = props;
      return <span {...domProps}>{children}</span>;
    },
  },
}));

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

    // Navigation elements should not be present for unauthenticated users
    const sidebar = screen.queryByText(/dashboard/i);
    // Login page may show "Dashboard" text in some context,
    // but the sidebar component itself won't render
    expect(document.querySelector('[class*="md:ml-"]')).toBeNull();
  });
});
