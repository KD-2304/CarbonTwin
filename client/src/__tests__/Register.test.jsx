import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register.jsx';

// Mock AuthContext
const mockRegister = vi.fn();

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: null,
    register: mockRegister,
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

describe('Register Page', () => {
  const renderRegister = () => render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  it('renders registration form with all required fields', () => {
    renderRegister();

    expect(screen.getByLabelText(/name/i)).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByLabelText(/city/i)).toBeDefined();
    expect(screen.getByLabelText(/country/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
  });

  it('renders a link to the login page', () => {
    renderRegister();
    expect(screen.getByText(/sign in/i)).toBeDefined();
  });

  it('calls register with form data on submission', async () => {
    mockRegister.mockResolvedValueOnce({ onboardingComplete: false });
    renderRegister();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password1234' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Mumbai' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'India' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password1234',
        city: 'Mumbai',
        country: 'India'
      });
    });
  });

  it('displays error message when registration fails', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: 'Email already registered' } }
    });
    renderRegister();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'dup@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password1234' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeDefined();
    });
  });
});
