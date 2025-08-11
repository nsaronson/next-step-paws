import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar';

describe('Calendar Component', () => {
  const mockOnSlotSelect = jest.fn();
  
  const mockAvailableSlots = [
    {
      id: 'slot-1',
      date: '2024-01-15',
      time: '09:00',
      duration: 30,
      isBooked: false
    },
    {
      id: 'slot-2',
      date: '2024-01-15',
      time: '09:00',
      duration: 60,
      isBooked: false
    },
    {
      id: 'slot-3',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      isBooked: true
    },
    {
      id: 'slot-4',
      date: '2024-01-16',
      time: '14:00',
      duration: 30,
      isBooked: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date to ensure consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders calendar with week view', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
    expect(screen.getByLabelText('Next week')).toBeInTheDocument();
  });

  it('displays time slots correctly', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('shows available slots with correct duration labels', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    expect(screen.getAllByText('30m')).toHaveLength(2); // slot-1 and slot-4
    expect(screen.getAllByText('60m')).toHaveLength(2); // slot-2 and slot-3
  });

  it('distinguishes between available and booked slots', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    const availableSlots = screen.getAllByText('30m').concat(screen.getAllByText('60m'));
    const bookedSlots = availableSlots.filter(slot => 
      slot.closest('button')?.disabled
    );
    
    expect(bookedSlots).toHaveLength(1); // Only slot-3 is booked
  });

  it('calls onSlotSelect when available slot is clicked', async () => {
    
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    const availableSlot = screen.getAllByText('30m')[0];
    await userEvent.click(availableSlot);
    
    expect(mockOnSlotSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'slot-1',
        time: '09:00',
        duration: 30
      })
    );
  });

  it('does not call onSlotSelect when booked slot is clicked', async () => {
    
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    // Find the booked slot button
    const bookedSlot = screen.getAllByText('60m').find(slot => 
      slot.closest('button')?.disabled
    );
    
    if (bookedSlot?.closest('button')) {
      await userEvent.click(bookedSlot.closest('button')!);
    }
    
    expect(mockOnSlotSelect).not.toHaveBeenCalled();
  });

  it('highlights selected slot', () => {
    const selectedSlot = mockAvailableSlots[0];
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
      selectedSlot={selectedSlot}
    />);
    
    const selectedSlotElement = screen.getAllByText('30m')[0];
    expect(selectedSlotElement.closest('button')).toHaveClass('selected');
  });

  it('navigates to previous week', async () => {
    
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    await userEvent.click(screen.getByLabelText('Previous week'));
    
    // Should show previous week's dates
    // We can check if the month/year display changes or specific dates
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('navigates to next week', async () => {
    
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    await userEvent.click(screen.getByLabelText('Next week'));
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('displays day headers correctly', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    // Check for weekday headers
    expect(screen.getByText(/Mon/)).toBeInTheDocument();
    expect(screen.getByText(/Tue/)).toBeInTheDocument();
    expect(screen.getByText(/Wed/)).toBeInTheDocument();
    expect(screen.getByText(/Thu/)).toBeInTheDocument();
    expect(screen.getByText(/Fri/)).toBeInTheDocument();
  });

  it('disables weekend slots', () => {
    const weekendSlots = [
      {
        id: 'weekend-1',
        date: '2024-01-13', // Saturday
        time: '10:00',
        duration: 60,
        isBooked: false
      },
      {
        id: 'weekend-2',
        date: '2024-01-14', // Sunday
        time: '10:00',
        duration: 60,
        isBooked: false
      }
    ];

    render(<Calendar 
      availableSlots={weekendSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    // Weekend slots should be disabled/not shown
    const slots = screen.queryAllByText('60m');
    expect(slots).toHaveLength(0); // No slots should be available on weekends
  });

  it('shows tooltip with slot information', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    const slotButton = screen.getAllByText('30m')[0];
    expect(slotButton.closest('button')).toHaveAttribute('title', '09:00 - 30 minutes');
  });

  it('shows booked slot tooltip correctly', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    const bookedSlot = screen.getAllByText('60m').find(slot => 
      slot.closest('button')?.disabled
    );
    
    expect(bookedSlot?.closest('button')).toHaveAttribute('title', '10:00 - 60 minutes (Booked)');
  });

  it('displays legend correctly', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Booked')).toBeInTheDocument();
  });

  it('handles empty slots array', () => {
    render(<Calendar 
      availableSlots={[]} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.queryByText('30m')).not.toBeInTheDocument();
    expect(screen.queryByText('60m')).not.toBeInTheDocument();
  });

  it('handles slots for different durations in same time slot', () => {
    const sameTimeSlots = [
      {
        id: 'same-time-1',
        date: '2024-01-15',
        time: '09:00',
        duration: 30,
        isBooked: false
      },
      {
        id: 'same-time-2',
        date: '2024-01-15',
        time: '09:00',
        duration: 60,
        isBooked: false
      }
    ];

    render(<Calendar 
      availableSlots={sameTimeSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    // Should show both duration options for the same time
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('60m')).toBeInTheDocument();
  });

  it('formats dates correctly for display', () => {
    render(<Calendar 
      availableSlots={mockAvailableSlots} 
      onSlotSelect={mockOnSlotSelect}
    />);
    
    // Check that dates are formatted as expected
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });
});
