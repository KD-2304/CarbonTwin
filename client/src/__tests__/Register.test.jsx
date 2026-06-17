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
    expect(screen.getByPlaceholderText(/At least 8 characters/i)).toBeDefined();
    expect(screen.getByLabelText(/city/i)).toBeDefined();
    expect(screen.getByLabelText(/country/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
  });

  it('renders a link to the login page', () => {
    renderRegister();
    expect(screen.getByText(/sign in/i)).toBeDefined();
  });

});
