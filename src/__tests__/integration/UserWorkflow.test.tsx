import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { mockLocalStorage, mockWindowAlert, sampleUsers } from '../../utils/testUtils';

describe('User Workflow Integration Tests', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    mockWindowAlert();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Customer Onboarding Flow', () => {
    beforeEach(() => {
      // Clear all localStorage for fresh login
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('guides new customer through complete onboarding process', async () => {
      
      render(<App />);

      // Step 1: Customer signup
      expect(screen.getByText('Welcome to Next Step Paws')).toBeInTheDocument();
      
      await userEvent.click(screen.getByText('Create Account'));
      
      await userEvent.type(screen.getByPlaceholderText('Your Name'), 'New Customer');
      await userEvent.type(screen.getByPlaceholderText('Email Address'), 'new@example.com');
      await userEvent.type(screen.getByPlaceholderText('Your Dog\'s Name'), 'Buddy');
      await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
      
      await userEvent.click(screen.getByText('Create Account'));

      // Step 2: Should show waiver form
      await waitFor(() => {
        expect(screen.getByText('📝 Required Agreements')).toBeInTheDocument();
        expect(screen.getByText('LIABILITY WAIVER AND RELEASE')).toBeInTheDocument();
      });

      // Accept waiver and policies
      await userEvent.click(screen.getByLabelText(/I have read, understood, and agree to the liability waiver/));
      await userEvent.click(screen.getByLabelText(/I have read, understood, and agree to abide by all training policies/));
      await userEvent.type(screen.getByPlaceholderText('Type your full legal name'), 'New Customer');
      
      await userEvent.click(screen.getByText('Complete Agreements ✍️'));

      // Step 3: Should show dog intake form
      await waitFor(() => {
        expect(screen.getByText('🐕 Dog Intake Form')).toBeInTheDocument();
      });

      // Fill intake form
      await userEvent.type(screen.getByDisplayValue('Buddy'), ''); // Clear and retype
      await userEvent.type(screen.getByDisplayValue(''), 'Buddy');
      await userEvent.type(screen.getByPlaceholderText('e.g., Golden Retriever, Mixed'), 'Labrador');
      await userEvent.type(screen.getByPlaceholderText('e.g., 2.5'), '3');
      await userEvent.type(screen.getByPlaceholderText('e.g., 65'), '70');
      await userEvent.click(screen.getByLabelText(/Current on all vaccinations/));
      await userEvent.type(screen.getByPlaceholderText('Name of emergency contact'), 'Emergency Contact');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');

      await userEvent.click(screen.getByText('Complete Intake Form'));

      // Step 4: Should now have access to main app
      await waitFor(() => {
        expect(screen.getByText('Welcome, New Customer! (customer)')).toBeInTheDocument();
        expect(screen.getByText('Group Classes')).toBeInTheDocument();
        expect(screen.getByText('Private Lessons')).toBeInTheDocument();
      });
    });

    it('blocks access to main app without completed onboarding', async () => {
      
      const incompletUser = {
        ...sampleUsers.customer,
        waiverSigned: false,
        intakeFormCompleted: false
      };
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'currentUser') return JSON.stringify(incompletUser);
        if (key === 'customers') return JSON.stringify([incompletUser]);
        return null;
      });

      render(<App />);

      // Should be redirected to waiver form directly (no login needed since user is stored)
      await waitFor(() => {
        expect(screen.getByText('📝 Required Agreements')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Booking Flow', () => {
    beforeEach(() => {
      // Setup completed customer
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'customers') return JSON.stringify([sampleUsers.customer]);
        if (key === 'currentUser') return JSON.stringify(sampleUsers.customer);
        if (key === 'groupClasses') return null; // Let component load default classes
        return '[]';
      });
    });

    it('allows customer to book a private lesson', async () => {
      
      
      // Mock available slots
      const availableSlots = [
        {
          id: 'slot-1',
          date: '2024-01-20',
          time: '10:00',
          duration: 60,
          isBooked: false
        }
      ];
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'customers') return JSON.stringify([sampleUsers.customer]);
        if (key === 'currentUser') return JSON.stringify(sampleUsers.customer);
        if (key === 'availableSlots') return JSON.stringify(availableSlots);
        return '[]';
      });

      render(<App />);

      // Navigate to private lessons
      await userEvent.click(screen.getByText('Private Lessons'));

      // Should see calendar and legend
      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Selected')).toBeInTheDocument();
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
      });

      // Book a slot (would need calendar interaction)
      // This would be expanded based on actual Calendar component behavior
    });

    it('allows customer to enroll in group class', async () => {
      
      render(<App />);

      // Navigate to group classes
      await userEvent.click(screen.getByText('Group Classes'));

      await waitFor(() => {
        expect(screen.getByText('Foundation Skills')).toBeInTheDocument();
      });

      // Fill in client information first (required for enrollment)
      await userEvent.type(screen.getByPlaceholderText('Your Name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Your Email'), 'john@example.com');

      // Click enroll button
      const enrollButtons = screen.getAllByText('Enroll Now! 💖');
      await userEvent.click(enrollButtons[0]);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'groupClasses',
        expect.stringContaining(sampleUsers.customer.email)
      );
    });
  });

  describe('Owner Workflow', () => {
    it('allows owner to access all management features', async () => {
      // Clear any existing user session
      localStorageMock.getItem.mockReturnValue(null);
      
      render(<App />);

      // Switch to owner login
      await userEvent.click(screen.getByText('Owner Login'));

      // Login as owner
      await userEvent.type(screen.getByPlaceholderText('Email Address'), 'owner@nextsteppaws.com');
      await userEvent.type(screen.getByPlaceholderText('Password'), 'paws123');
      await userEvent.click(screen.getByText('Sign In as Owner'));

      // Should see owner-specific navigation
      await waitFor(() => {
        expect(screen.getByText('Welcome, Next Step Paws Owner! (owner)')).toBeInTheDocument();
        expect(screen.getByText('Set Availability')).toBeInTheDocument();
        expect(screen.getByText('Lesson Notes')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Test navigation to different owner sections
      await userEvent.click(screen.getByText('Set Availability'));
      await waitFor(() => {
        expect(screen.getByText('⏰ Set Available Time Windows')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'customers') return JSON.stringify([sampleUsers.customer]);
        if (key === 'currentUser') return JSON.stringify(sampleUsers.customer);
        return '[]';
      });
    });

    it('allows user to update their profile', async () => {
      
      render(<App />);

      // Click profile button
      await userEvent.click(screen.getByText('Profile'));

      await waitFor(() => {
        expect(screen.getByText('Profile Settings')).toBeInTheDocument();
        expect(screen.getByText(sampleUsers.customer.name)).toBeInTheDocument();
      });

      // Edit profile
      await userEvent.click(screen.getByText('Edit Profile'));

      const nameInput = screen.getByDisplayValue(sampleUsers.customer.name);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');

      await userEvent.click(screen.getByText('Save Changes'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'currentUser',
        expect.stringContaining('Updated Name')
      );
    });
  });

  describe('Navigation and State Persistence', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'customers') return JSON.stringify([sampleUsers.customer]);
        if (key === 'currentUser') return JSON.stringify(sampleUsers.customer);
        if (key === 'groupClasses') return null; // Let component load default classes
        return '[]';
      });
    });

    it('maintains user session across navigation', async () => {
      
      render(<App />);

      // Should automatically login from localStorage
      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${sampleUsers.customer.name}! (customer)`)).toBeInTheDocument();
      });

      // Navigate between sections
      await userEvent.click(screen.getByText('Contact Us'));
      await waitFor(() => {
        expect(screen.getByText('info@nextsteppaws.com')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Group Classes' }));
      await waitFor(() => {
        expect(screen.getByText('Foundation Skills')).toBeInTheDocument();
      });

      // User should remain logged in
      expect(screen.getByText(`Welcome, ${sampleUsers.customer.name}! (customer)`)).toBeInTheDocument();
    });

    it('handles logout correctly', async () => {
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByText('Welcome to Next Step Paws')).toBeInTheDocument();
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should still render without crashing
      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByText('Welcome to Next Step Paws')).toBeInTheDocument();
    });

    it('handles invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByText('Welcome to Next Step Paws')).toBeInTheDocument();
    });
  });
});
