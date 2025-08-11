import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page for unauthenticated users', () => {
  render(<App />);
  const welcomeText = screen.getByText(/Welcome to Next Step Paws/i);
  expect(welcomeText).toBeInTheDocument();
});

test('renders customer login form by default', () => {
  render(<App />);
  const customerLoginButton = screen.getByText(/Customer Login/i);
  expect(customerLoginButton).toBeInTheDocument();
});
