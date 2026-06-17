import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login.jsx';

// Mock AuthContext
const mockLogin = vi.fn();

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    loading: false,
  }),
  AuthProvider: ({ children }) => <>{children}</>,
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

describe('Login Page', () => {
  const renderLogin = () => render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  it('renders login form with email and password fields', () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('renders a link to the registration page', () => {
    renderLogin();
    expect(screen.getByText(/create one/i)).toBeDefined();
  });

  it('has a toggle button for password visibility', () => {
    renderLogin();

    const toggleBtn = screen.getByLabelText(/show password/i);
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/hide password/i)).toBeDefined();
  });
});
