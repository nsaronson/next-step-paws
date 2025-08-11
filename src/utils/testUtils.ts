// Test utilities for common testing patterns
import React from 'react';

export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  return localStorageMock;
};

export const mockWindowAlert = () => {
  window.alert = jest.fn();
  return window.alert;
};

export const mockWindowConfirm = (returnValue: boolean = true) => {
  window.confirm = jest.fn().mockReturnValue(returnValue);
  return window.confirm;
};

// Sample test data
export const sampleUsers = {
  customer: {
    id: 'customer-1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'customer' as const,
    dogName: 'Buddy',
    password: 'password123',
    waiverSigned: true,
    policiesAccepted: true,
    intakeFormCompleted: true
  },
  owner: {
    id: 'owner-1',
    email: 'owner@nextsteppaws.com',
    name: 'Next Step Paws Owner',
    role: 'owner' as const,
    password: 'paws123'
  }
};

export const sampleGroupClasses = [
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
    spots: 3,
    maxSpots: 6,
    price: 180,
    level: 'Puppy' as const,
    enrolled: ['John Doe (john@example.com)', 'Jane Smith (jane@example.com)', 'Bob Wilson (bob@example.com)'],
    waitlist: []
  }
];

export const sampleAvailableSlots = [
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
    date: '2024-01-16',
    time: '14:00',
    duration: 60,
    isBooked: true
  }
];

export const sampleBookings = [
  {
    id: 'booking-1',
    slotId: 'slot-3',
    customerEmail: 'john@example.com',
    customerName: 'John Doe',
    dogName: 'Buddy',
    date: '2024-01-16',
    time: '14:00',
    duration: 60,
    notes: 'First lesson',
    status: 'confirmed' as const,
    createdAt: '2024-01-15T10:00:00Z'
  }
];

export const sampleDogIntake = {
  id: 'intake-1',
  dogName: 'Buddy',
  ownerEmail: 'john@example.com',
  ownerName: 'John Doe',
  breed: 'Golden Retriever',
  age: 2,
  weight: 65,
  sex: 'male' as const,
  spayedNeutered: true,
  vaccinationUpToDate: true,
  medicalConditions: 'None',
  currentMedications: 'None',
  behaviorConcerns: 'Pulls on leash',
  trainingGoals: 'Better leash walking and recall',
  previousTraining: 'Basic puppy class',
  energyLevel: 'high' as const,
  socialization: 'good' as const,
  emergencyContact: 'Jane Doe',
  emergencyPhone: '555-123-4567',
  vetInfo: 'City Vet Clinic - 555-987-6543',
  specialInstructions: 'Loves treats',
  createdAt: '2024-01-15T10:00:00Z'
};

// Helper function to create a mock React component for testing
export const createMockComponent = (name: string) => {
  const MockComponent = () => React.createElement('div', { 'data-testid': `mock-${name.toLowerCase()}` }, name);
  MockComponent.displayName = name;
  return MockComponent;
};

// Helper to wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Date utilities for consistent testing
export const createTestDate = (dateString: string) => {
  return new Date(dateString + 'T12:00:00Z');
};

export const formatTestDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};
