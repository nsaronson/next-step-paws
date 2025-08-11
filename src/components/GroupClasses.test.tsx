import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupClasses from './GroupClasses';
import { GroupClass } from '../types/auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.alert and confirm
const mockAlert = jest.fn();
const mockConfirm = jest.fn();
window.alert = mockAlert;
window.confirm = mockConfirm;

describe('GroupClasses Component', () => {
  const mockClasses: GroupClass[] = [
    {
      id: '1',
      name: 'Foundation Skills',
      description: 'Perfect for dogs learning their first commands!',
      schedule: 'Tuesdays & Thursdays, 10:00 AM - 11:00 AM',
      spots: 0,
      maxSpots: 8,
      price: 120,
      level: 'Introductory skills' as const,
      enrolled: [],
      waitlist: []
    },
    {
      id: '2',
      name: 'Puppy Foundations',
      description: 'Socialization and basic training for puppies 8-16 weeks old.',
      schedule: 'Saturdays, 2:00 PM - 3:30 PM',
      spots: 5,
      maxSpots: 6,
      price: 180,
      level: 'Puppy' as const,
      enrolled: ['John Doe (john@example.com)', 'Jane Smith (jane@example.com)', 'Bob Wilson (bob@example.com)', 'Alice Brown (alice@example.com)', 'Charlie Davis (charlie@example.com)'],
      waitlist: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockClasses));
  });

  it('renders group classes list', () => {
    render(<GroupClasses />);
    
    expect(screen.getByText('Group Classes')).toBeInTheDocument();
    expect(screen.getByText('Foundation Skills')).toBeInTheDocument();
    expect(screen.getByText('Puppy Foundations')).toBeInTheDocument();
  });

  it('displays class information correctly', () => {
    render(<GroupClasses />);
    
    expect(screen.getByText('Perfect for dogs learning their first commands!')).toBeInTheDocument();
    expect(screen.getByText('Tuesdays & Thursdays, 10:00 AM - 11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('$120')).toBeInTheDocument();
    expect(screen.getByText('0/8 enrolled')).toBeInTheDocument();
  });

  it('shows different enrollment statuses', () => {
    render(<GroupClasses />);
    
    // Available class
    expect(screen.getByText('0/8 enrolled')).toBeInTheDocument();
    
    // Nearly full class
    expect(screen.getByText('5/6 enrolled')).toBeInTheDocument();
  });

  it('displays correct level colors', () => {
    render(<GroupClasses />);
    
    const introductoryBadge = screen.getByText('Introductory skills');
    const puppyBadge = screen.getByText('Puppy');
    
    expect(introductoryBadge.parentElement).toHaveStyle({ backgroundColor: '#4caf50' });
    expect(puppyBadge.parentElement).toHaveStyle({ backgroundColor: '#ff9800' });
  });

  it('opens enrollment modal when enroll button is clicked', async () => {
    
    render(<GroupClasses />);
    
    // Click enroll button for first class
    const enrollButtons = screen.getAllByText('Enroll Now');
    await userEvent.click(enrollButtons[0]);
    
    expect(screen.getByText('Enroll in Foundation Skills')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
  });

  it('validates enrollment form fields', async () => {
    
    render(<GroupClasses />);
    
    // Open enrollment modal
    const enrollButtons = screen.getAllByText('Enroll Now');
    await userEvent.click(enrollButtons[0]);
    
    // Try to submit without filling fields
    await userEvent.click(screen.getByText('Complete Enrollment'));
    
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields!');
  });

  it('successfully enrolls student in available class', async () => {
    
    render(<GroupClasses />);
    
    // Open enrollment modal for available class
    const enrollButtons = screen.getAllByText('Enroll Now');
    await userEvent.click(enrollButtons[0]);
    
    // Fill enrollment form
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    
    await userEvent.click(screen.getByText('Complete Enrollment'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'groupClasses',
      expect.stringContaining('John Doe (john@example.com)')
    );
    expect(window.alert).toHaveBeenCalledWith('Successfully enrolled in Foundation Skills! 🎉');
  });

  it('adds student to waitlist when class is full', async () => {
    
    const fullClasses = [...mockClasses];
    fullClasses[1].spots = 6; // Make it full
    localStorageMock.getItem.mockReturnValue(JSON.stringify(fullClasses));
    
    render(<GroupClasses />);
    
    // Open enrollment modal for full class
    const enrollButtons = screen.getAllByText('Join Waitlist');
    await userEvent.click(enrollButtons[0]);
    
    // Fill enrollment form
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'New Student');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'new@example.com');
    
    await userEvent.click(screen.getByText('Join Waitlist'));
    
    expect(window.alert).toHaveBeenCalledWith('Added to waitlist for Puppy Foundations! You\'ll be notified if a spot opens up.');
  });

  it('prevents duplicate enrollment', async () => {
    
    render(<GroupClasses />);
    
    // Open enrollment modal
    const enrollButtons = screen.getAllByText('Enroll Now');
    await userEvent.click(enrollButtons[0]);
    
    // Try to enroll existing student
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    
    // Mock existing enrollment
    const existingEnrolled = [...mockClasses];
    existingEnrolled[0].enrolled = ['John Doe (john@example.com)'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingEnrolled));
    
    await userEvent.click(screen.getByText('Complete Enrollment'));
    
    expect(window.alert).toHaveBeenCalledWith('You are already enrolled in this class!');
  });

  it('closes modal when close button is clicked', async () => {
    
    render(<GroupClasses />);
    
    // Open modal
    const enrollButtons = screen.getAllByText('Enroll Now');
    await userEvent.click(enrollButtons[0]);
    
    // Close modal
    await userEvent.click(screen.getByText('×'));
    
    expect(screen.queryByText('Enroll in Foundation Skills')).not.toBeInTheDocument();
  });

  it('displays enrolled students list when expanded', async () => {
    
    render(<GroupClasses />);
    
    // Find and click "Show Students" button for class with enrollments
    const showStudentsButtons = screen.getAllByText('Show Students');
    await userEvent.click(showStudentsButtons[0]);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles class withdrawal correctly', async () => {
    
    mockConfirm.mockReturnValue(true);
    
    render(<GroupClasses />);
    
    // Show students first
    const showStudentsButtons = screen.getAllByText('Show Students');
    await userEvent.click(showStudentsButtons[0]);
    
    // Find and click withdraw button
    const withdrawButtons = screen.getAllByText('Withdraw');
    await userEvent.click(withdrawButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to withdraw John Doe from this class?');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('shows waitlist information when available', async () => {
    
    const classesWithWaitlist: GroupClass[] = [...mockClasses];
    classesWithWaitlist[1].waitlist = ['Waitlist Student (wait@example.com)'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(classesWithWaitlist));
    
    render(<GroupClasses />);
    
    // Show students for class with waitlist
    const showStudentsButtons = screen.getAllByText('Show Students');
    await userEvent.click(showStudentsButtons[0]);
    
    expect(screen.getByText('Waitlist (1)')).toBeInTheDocument();
    expect(screen.getByText('Waitlist Student')).toBeInTheDocument();
  });

  it('automatically promotes from waitlist when spot opens', async () => {
    
    mockConfirm.mockReturnValue(true);
    mockAlert.mockClear();
    
    const classesWithWaitlist: GroupClass[] = [...mockClasses];
    classesWithWaitlist[1].waitlist = ['Waitlist Student (wait@example.com)'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(classesWithWaitlist));
    
    render(<GroupClasses />);
    
    // Show students
    const showStudentsButtons = screen.getAllByText('Show Students');
    await userEvent.click(showStudentsButtons[0]);
    
    // Withdraw a student to open a spot
    const withdrawButtons = screen.getAllByText('Withdraw');
    await userEvent.click(withdrawButtons[0]);
    
    expect(window.alert).toHaveBeenCalledWith('Student withdrawn successfully! Waitlist Student has been automatically enrolled from the waitlist.');
  });

  it('handles empty state correctly', () => {
    localStorageMock.getItem.mockReturnValue('[]');
    render(<GroupClasses />);
    
    expect(screen.getByText('Foundation Skills')).toBeInTheDocument(); // Default classes should still show
  });

  it('filters classes by level correctly', () => {
    render(<GroupClasses />);
    
    expect(screen.getByText('Introductory skills')).toBeInTheDocument();
    expect(screen.getByText('Puppy')).toBeInTheDocument();
  });
});
