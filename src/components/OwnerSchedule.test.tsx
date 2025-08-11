import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OwnerSchedule from './OwnerSchedule';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

describe('OwnerSchedule Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock data
    const mockBookings = [
      {
        id: 'booking-1',
        slotId: 'slot-1',
        customerEmail: 'john@example.com',
        customerName: 'John Doe',
        dogName: 'Buddy',
        date: '2025-08-11',
        time: '10:00 AM',
        duration: 60,
        status: 'confirmed',
        createdAt: '2025-08-10T12:00:00.000Z',
        notes: 'First training session'
      }
    ];

    const mockGroupClasses = [
      {
        id: 'class-1',
        name: 'Puppy Training',
        schedule: 'Mondays 2:00 PM',
        enrolled: ['Alice Smith'],
        spots: 5,
        maxSpots: 6
      }
    ];

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'bookings') return JSON.stringify(mockBookings);
      if (key === 'groupClasses') return JSON.stringify(mockGroupClasses);
      return null;
    });
  });

  it('renders schedule interface correctly', () => {
    render(<OwnerSchedule />);
    
    expect(screen.getByText('📅 Daily Schedule')).toBeInTheDocument();
    expect(screen.getByText('🖨️ Print')).toBeInTheDocument();
    expect(screen.getByText('📅 Export ICS')).toBeInTheDocument();
    expect(screen.getByText('📅 Add to Google Calendar')).toBeInTheDocument();
  });

  it('exports appointment to Google Calendar correctly', () => {
    // Mock the current date to be 2025-08-11
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-11'));

    render(<OwnerSchedule />);
    
    // Click the Google Calendar export button
    const googleCalendarBtn = screen.getByText('📅 Add to Google Calendar');
    fireEvent.click(googleCalendarBtn);

    // Verify that window.open was called with the correct Google Calendar URL
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://calendar.google.com/calendar/render?action=TEMPLATE'),
      '_blank'
    );

    if (mockWindowOpen.mock.calls.length > 0) {
      const calledUrl = mockWindowOpen.mock.calls[0][0];
      expect(calledUrl).toContain('text=');
      expect(calledUrl).toContain('location=Next%20Step%20Paws%20Training%20Facility');
      expect(calledUrl).toContain('details=Client%3A%20John%20Doe');
    }

    jest.useRealTimers();
  });

  it('handles multiple appointments with confirmation', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-11'));

    // Add multiple appointments for the same day
    const mockBookings = [
      {
        id: 'booking-1',
        slotId: 'slot-1',
        customerEmail: 'john@example.com',
        customerName: 'John Doe',
        dogName: 'Buddy',
        date: '2025-08-11',
        time: '10:00 AM',
        duration: 60,
        status: 'confirmed',
        createdAt: '2025-08-10T12:00:00.000Z'
      },
      {
        id: 'booking-2',
        slotId: 'slot-2',
        customerEmail: 'jane@example.com',
        customerName: 'Jane Smith',
        dogName: 'Max',
        date: '2025-08-11',
        time: '2:00 PM',
        duration: 60,
        status: 'confirmed',
        createdAt: '2025-08-10T12:00:00.000Z'
      }
    ];

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'bookings') return JSON.stringify(mockBookings);
      if (key === 'groupClasses') return JSON.stringify([]);
      return null;
    });

    render(<OwnerSchedule />);
    
    const googleCalendarBtn = screen.getByText('📅 Add to Google Calendar');
    fireEvent.click(googleCalendarBtn);

    // Should prompt user about multiple appointments
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('You have 2 appointments on this date')
    );

    jest.useRealTimers();
  });

  it('handles empty schedule gracefully', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-11'));
    
    localStorageMock.getItem.mockReturnValue('[]');
    
    // Mock alert
    const mockAlert = jest.fn();
    Object.defineProperty(window, 'alert', {
      value: mockAlert,
    });

    render(<OwnerSchedule />);
    
    const googleCalendarBtn = screen.getByText('📅 Add to Google Calendar');
    fireEvent.click(googleCalendarBtn);

    expect(mockAlert).toHaveBeenCalledWith('No appointments to export for this date.');
    
    jest.useRealTimers();
  });

  it('generates ICS file download correctly', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-11'));
    
    render(<OwnerSchedule />);
    
    const exportBtn = screen.getByText('📅 Export ICS');
    fireEvent.click(exportBtn);

    // Verify that createObjectURL was called for ICS export
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/calendar'
      })
    );
    
    jest.useRealTimers();
  });
});
