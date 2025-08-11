import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from './UserProfile';
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

describe('UserProfile Component', () => {
  const mockOnUpdate = jest.fn();
  
  const mockCustomerUser: User = {
    id: 'customer-1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'customer',
    dogName: 'Buddy',
    password: 'password123'
  };

  const mockOwnerUser: User = {
    id: 'owner-1',
    email: 'owner@nextsteppaws.com',
    name: 'Next Step Paws Owner',
    role: 'owner',
    password: 'paws123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  it('renders user profile in view mode initially', () => {
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('displays owner role correctly', () => {
    render(<UserProfile user={mockOwnerUser} onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('Training Owner')).toBeInTheDocument();
    expect(screen.queryByText('Buddy')).not.toBeInTheDocument(); // Owner has no dog
  });

  it('switches to edit mode when Edit Profile is clicked', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('allows customer to edit name and dog name', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    
    // Clear and update name
    const nameInput = screen.getByDisplayValue('John Doe');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Smith');
    
    // Clear and update dog name
    const dogNameInput = screen.getByDisplayValue('Buddy');
    await userEvent.clear(dogNameInput);
    await userEvent.type(dogNameInput, 'Max');
    
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockCustomerUser,
      name: 'John Smith',
      dogName: 'Max'
    });
    expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
  });

  it('shows password change fields when checkbox is checked', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    
    // Check password change checkbox
    await userEvent.click(screen.getByLabelText('Change Password'));
    
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password (min 6 characters)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
  });

  it('validates password change requirements', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    await userEvent.click(screen.getByLabelText('Change Password'));
    
    // Try to submit without current password
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(window.alert).toHaveBeenCalledWith('Please enter your current password to make changes.');
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('validates new password length', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    await userEvent.click(screen.getByLabelText('Change Password'));
    
    await userEvent.type(screen.getByPlaceholderText('Enter current password'), 'password123');
    await userEvent.type(screen.getByPlaceholderText('Enter new password (min 6 characters)'), '123');
    await userEvent.type(screen.getByPlaceholderText('Confirm new password'), '123');
    
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(window.alert).toHaveBeenCalledWith('New password must be at least 6 characters long.');
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('validates password confirmation match', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    await userEvent.click(screen.getByLabelText('Change Password'));
    
    await userEvent.type(screen.getByPlaceholderText('Enter current password'), 'password123');
    await userEvent.type(screen.getByPlaceholderText('Enter new password (min 6 characters)'), 'newpassword');
    await userEvent.type(screen.getByPlaceholderText('Confirm new password'), 'differentpassword');
    
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(window.alert).toHaveBeenCalledWith('New passwords do not match.');
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('validates current password is correct', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    await userEvent.click(screen.getByLabelText('Change Password'));
    
    await userEvent.type(screen.getByPlaceholderText('Enter current password'), 'wrongpassword');
    await userEvent.type(screen.getByPlaceholderText('Enter new password (min 6 characters)'), 'newpassword');
    await userEvent.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword');
    
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(window.alert).toHaveBeenCalledWith('Current password is incorrect.');
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('successfully changes password with valid inputs', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    await userEvent.click(screen.getByLabelText('Change Password'));
    
    await userEvent.type(screen.getByPlaceholderText('Enter current password'), 'password123');
    await userEvent.type(screen.getByPlaceholderText('Enter new password (min 6 characters)'), 'newpassword');
    await userEvent.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword');
    
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockCustomerUser,
      password: 'newpassword'
    });
    expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
  });

  it('cancels editing and resets form', async () => {
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    
    // Make some changes
    const nameInput = screen.getByDisplayValue('John Doe');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Changed Name');
    
    // Cancel
    await userEvent.click(screen.getByText('Cancel'));
    
    // Should be back to view mode with original data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('updates localStorage for customer changes', async () => {
    
    const customers = [mockCustomerUser, { id: 'customer-2', email: 'jane@example.com' }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(customers));
    
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    await userEvent.click(screen.getByText('Edit Profile'));
    
    const nameInput = screen.getByDisplayValue('John Doe');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Smith');
    
    await userEvent.click(screen.getByText('Save Changes'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'customers',
      expect.stringContaining('John Smith')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'currentUser',
      expect.stringContaining('John Smith')
    );
  });

  it('disables email field editing', () => {
    render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    const emailInput = screen.getByDisplayValue('john@example.com');
    expect(emailInput).toBeDisabled();
    expect(screen.getByText('Email (cannot be changed)')).toBeInTheDocument();
  });

  it('shows correct role badge styling', () => {
    const { rerender } = render(<UserProfile user={mockCustomerUser} onUpdate={mockOnUpdate} />);
    
    const customerBadge = screen.getByText('Customer');
    expect(customerBadge).toHaveClass('customer');
    
    rerender(<UserProfile user={mockOwnerUser} onUpdate={mockOnUpdate} />);
    
    const ownerBadge = screen.getByText('Training Owner');
    expect(ownerBadge).toHaveClass('owner');
  });
});
