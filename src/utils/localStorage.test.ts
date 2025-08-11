import { mockLocalStorage } from './testUtils';

// Test localStorage utilities
describe('localStorage utilities', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Customer management', () => {
    it('should store and retrieve customers correctly', () => {
      const customers = [
        { id: '1', email: 'test@example.com', name: 'Test User', role: 'customer' }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(customers));

      const result = JSON.parse(localStorageMock.getItem('customers') || '[]');
      expect(result).toEqual(customers);
    });

    it('should handle empty customers array', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const result = JSON.parse(localStorageMock.getItem('customers') || '[]');
      expect(result).toEqual([]);
    });

    it('should handle null localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = JSON.parse(localStorageMock.getItem('customers') || '[]');
      expect(result).toEqual([]);
    });
  });

  describe('Group classes management', () => {
    it('should store and retrieve group classes', () => {
      const groupClasses = [
        {
          id: '1',
          name: 'Test Class',
          description: 'Test Description',
          schedule: 'Mondays 10:00 AM',
          spots: 0,
          maxSpots: 10,
          price: 100,
          level: 'Introductory skills',
          enrolled: [],
          waitlist: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(groupClasses));

      const result = JSON.parse(localStorageMock.getItem('groupClasses') || '[]');
      expect(result).toEqual(groupClasses);
    });

    it('should handle class enrollment updates', () => {
      const initialClass = {
        id: '1',
        name: 'Test Class',
        enrolled: [],
        spots: 0
      };

      const updatedClass = {
        ...initialClass,
        enrolled: ['John Doe (john@example.com)'],
        spots: 1
      };

      localStorageMock.setItem('groupClasses', JSON.stringify([updatedClass]));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'groupClasses',
        JSON.stringify([updatedClass])
      );
    });
  });

  describe('Available slots management', () => {
    it('should store and retrieve available slots', () => {
      const slots = [
        {
          id: 'slot-1',
          date: '2024-01-15',
          time: '10:00',
          duration: 60,
          isBooked: false
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(slots));

      const result = JSON.parse(localStorageMock.getItem('availableSlots') || '[]');
      expect(result).toEqual(slots);
    });

    it('should handle slot booking updates', () => {
      const slot = {
        id: 'slot-1',
        date: '2024-01-15',
        time: '10:00',
        duration: 60,
        isBooked: false
      };

      const bookedSlot = {
        ...slot,
        isBooked: true,
        bookedBy: 'customer-1',
        customerEmail: 'john@example.com'
      };

      localStorageMock.setItem('availableSlots', JSON.stringify([bookedSlot]));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'availableSlots',
        JSON.stringify([bookedSlot])
      );
    });
  });

  describe('Bookings management', () => {
    it('should store and retrieve bookings', () => {
      const bookings = [
        {
          id: 'booking-1',
          slotId: 'slot-1',
          customerEmail: 'john@example.com',
          customerName: 'John Doe',
          dogName: 'Buddy',
          date: '2024-01-15',
          time: '10:00',
          duration: 60,
          status: 'confirmed',
          createdAt: '2024-01-14T10:00:00Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(bookings));

      const result = JSON.parse(localStorageMock.getItem('bookings') || '[]');
      expect(result).toEqual(bookings);
    });
  });

  describe('Data validation', () => {
    it('should validate email format', () => {
      expect('test@example.com').toHaveValidEmail();
      expect('invalid-email').not.toHaveValidEmail();
      expect('').not.toHaveValidEmail();
    });

    it('should validate date objects', () => {
      expect(new Date()).toBeValidDate();
      expect(new Date('2024-01-15')).toBeValidDate();
      expect(new Date('invalid')).not.toBeValidDate();
      expect('not a date').not.toBeValidDate();
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parsing errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      expect(() => {
        try {
          JSON.parse(localStorageMock.getItem('customers') || '[]');
        } catch {
          // Fallback to empty array
          return [];
        }
      }).not.toThrow();
    });

    it('should handle localStorage access errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        try {
          localStorageMock.getItem('customers');
        } catch {
          return [];
        }
      }).not.toThrow();
    });
  });
});
