import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { User } from '../types/auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.alert
window.alert = jest.fn();

describe('Login Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login page with customer login selected by default', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText('Welcome to Next Step Paws')).toBeInTheDocument();
    expect(screen.getByText('Customer Login')).toHaveClass('active');
    expect(screen.getByText('Owner Login')).not.toHaveClass('active');
  });

  it('switches between customer and owner login modes', async () => {
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to owner login
    await userEvent.click(screen.getByText('Owner Login'));
    
    expect(screen.getByText('Owner Login')).toHaveClass('active');
    expect(screen.getByText('Customer Login')).not.toHaveClass('active');
  });

  it('shows signup form when "Create Account" is clicked', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    await userEvent.click(screen.getByText('Create Account'));
    
    expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Dog\'s Name')).toBeInTheDocument();
  });

  it('validates required fields during customer signup', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to signup mode
    await userEvent.click(screen.getByText('Create Account'));
    
    // Try to submit without filling fields
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields for signup!');
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('validates password length during signup', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to signup mode
    await userEvent.click(screen.getByText('Create Account'));
    
    // Fill form with short password
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Your Dog\'s Name'), 'Buddy');
    await userEvent.type(screen.getByPlaceholderText('Password'), '123');
    
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    expect(window.alert).toHaveBeenCalledWith('Password must be at least 6 characters long!');
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('successfully creates new customer account', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to signup mode
    await userEvent.click(screen.getByText('Create Account'));
    
    // Fill form with valid data
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Your Dog\'s Name'), 'Buddy');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'customers',
      expect.stringContaining('john@example.com')
    );
    expect(mockOnLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        name: 'John Doe',
        dogName: 'Buddy',
        role: 'customer'
      })
    );
  });

  it('prevents duplicate customer registration', async () => {
    
    const existingCustomers = [
      { id: '1', email: 'john@example.com', name: 'John Doe', role: 'customer' }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingCustomers));
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to signup mode
    await userEvent.click(screen.getByText('Create Account'));
    
    // Try to signup with existing email
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Your Dog\'s Name'), 'Max');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    expect(window.alert).toHaveBeenCalledWith('An account with this email already exists. Please sign in instead.');
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('successfully logs in existing customer with correct password', async () => {
    
    const existingCustomers = [
      { 
        id: '1', 
        email: 'john@example.com', 
        name: 'John Doe', 
        role: 'customer',
        password: 'password123',
        dogName: 'Buddy'
      }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingCustomers));
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Fill login form
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await userEvent.click(screen.getByRole('button', { name: /sign in as customer/i }));
    
    expect(mockOnLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        name: 'John Doe',
        role: 'customer'
      })
    );
  });

  it('rejects customer login with incorrect password', async () => {
    
    const existingCustomers = [
      { 
        id: '1', 
        email: 'john@example.com', 
        name: 'John Doe', 
        role: 'customer',
        password: 'password123'
      }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingCustomers));
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Fill login form with wrong password
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    
    await userEvent.click(screen.getByRole('button', { name: /sign in as customer/i }));
    
    expect(window.alert).toHaveBeenCalledWith('Incorrect password. Please try again.');
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('successfully logs in owner with correct credentials', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to owner login
    await userEvent.click(screen.getByText('Owner Login'));
    
    // Fill owner credentials
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'owner@nextsteppaws.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'paws123');
    
    await userEvent.click(screen.getByRole('button', { name: /sign in as owner/i }));
    
    expect(mockOnLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@nextsteppaws.com',
        name: 'Next Step Paws Owner',
        role: 'owner'
      })
    );
  });

  it('rejects owner login with incorrect credentials', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to owner login
    await userEvent.click(screen.getByText('Owner Login'));
    
    // Fill wrong credentials
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'wrong@email.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass');
    
    await userEvent.click(screen.getByRole('button', { name: /sign in as owner/i }));
    
    expect(window.alert).toHaveBeenCalledWith('Invalid owner credentials. Use: owner@nextsteppaws.com / paws123');
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('validates required fields for login', async () => {
    
    render(<Login onLogin={mockOnLogin} />);
    
    // Try to submit without filling fields
    await userEvent.click(screen.getByRole('button', { name: /sign in as customer/i }));
    
    expect(window.alert).toHaveBeenCalledWith('Please enter your email and password!');
    expect(mockOnLogin).not.toHaveBeenCalled();
  });
});
