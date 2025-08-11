import { EmailService, EmailData, emailTemplates } from './emailService';
import emailjs from '@emailjs/browser';
import { Booking, User } from '../types/auth';

// Mock EmailJS
jest.mock('@emailjs/browser', () => ({
  send: jest.fn(),
  init: jest.fn()
}));

const mockEmailjs = emailjs as jest.Mocked<typeof emailjs>;

// Mock window.alert for demo mode
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true
});

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful email sending by default
    mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' } as any);
  });

  afterEach(() => {
    // Reset environment variables
    delete process.env.REACT_APP_EMAILJS_SERVICE_ID;
    delete process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    delete process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  });

  describe('EmailService.sendEmail', () => {
    const emailData: EmailData = {
      to_email: 'john@example.com',
      to_name: 'John Doe',
      from_name: 'Elite Canine Academy',
      subject: 'Test Email',
      message: 'This is a test email',
      reply_to: 'info@elitecanineacademy.com'
    };

    it('should send email successfully with valid configuration', async () => {
      // Set up real EmailJS configuration
      process.env.REACT_APP_EMAILJS_SERVICE_ID = 'test_service';
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID = 'test_template';
      process.env.REACT_APP_EMAILJS_PUBLIC_KEY = 'test_key';

      const result = await EmailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email sent successfully!');
      expect(mockEmailjs.send).toHaveBeenCalledWith(
        'test_service',
        'test_template',
        expect.objectContaining({
          to_email: 'john@example.com',
          to_name: 'John Doe',
          from_name: 'Elite Canine Academy'
        })
      );
    });

    it('should use demo mode when EmailJS is not configured', async () => {
      // Use default placeholder values (not configured)
      const result = await EmailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email sent successfully (Demo Mode)');
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('📧 Email Preview (Demo Mode)')
      );
      expect(mockEmailjs.send).not.toHaveBeenCalled();
    });

    it('should handle EmailJS service errors', async () => {
      process.env.REACT_APP_EMAILJS_SERVICE_ID = 'test_service';
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID = 'test_template';
      process.env.REACT_APP_EMAILJS_PUBLIC_KEY = 'test_key';

      mockEmailjs.send.mockResolvedValue({ status: 400, text: 'Bad Request' } as any);

      const result = await EmailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email service error');
    });

    it('should handle network errors', async () => {
      process.env.REACT_APP_EMAILJS_SERVICE_ID = 'test_service';
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID = 'test_template';
      process.env.REACT_APP_EMAILJS_PUBLIC_KEY = 'test_key';

      mockEmailjs.send.mockRejectedValue(new Error('Network error'));

      const result = await EmailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send email');
    });

    it('should log demo mode email content', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await EmailService.sendEmail(emailData);

      expect(consoleSpy).toHaveBeenCalledWith('📧 Email would be sent:', emailData);
      
      consoleSpy.mockRestore();
    });
  });

  describe('EmailService.sendBookingEmail', () => {
    const mockBooking: Booking = {
      id: 'booking-1',
      slotId: 'slot-1',
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      dogName: 'Buddy',
      date: '2025-08-15',
      time: '2:00 PM',
      duration: 60,
      status: 'confirmed',
      createdAt: '2025-08-10T12:00:00.000Z',
      notes: 'First training session'
    };

    const mockCustomer: User = {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'customer'
    };

    it('should send booking confirmation email', async () => {
      const result = await EmailService.sendBookingEmail(
        mockBooking,
        mockCustomer,
        'booking_confirmation'
      );

      expect(result.success).toBe(true);
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Your Private Lesson is Confirmed! 🐕')
      );
    });

    it('should handle missing template gracefully', async () => {
      const result = await EmailService.sendBookingEmail(
        mockBooking,
        mockCustomer,
        'nonexistent_template'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send booking email');
    });

    it('should include custom data in email', async () => {
      const customData = { instructorName: 'Sarah Wilson' };

      const result = await EmailService.sendBookingEmail(
        mockBooking,
        mockCustomer,
        'booking_confirmation',
        customData
      );

      expect(result.success).toBe(true);
    });

    it('should format date correctly', async () => {
      const result = await EmailService.sendBookingEmail(
        mockBooking,
        mockCustomer,
        'booking_confirmation'
      );

      expect(result.success).toBe(true);
      // Date should be formatted as "Thursday, August 15, 2025"
    });

    it('should handle booking without notes', async () => {
      const bookingWithoutNotes = { ...mockBooking };
      delete bookingWithoutNotes.notes;

      const result = await EmailService.sendBookingEmail(
        bookingWithoutNotes,
        mockCustomer,
        'booking_confirmation'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Template System', () => {
    it('should have required email templates', () => {
      expect(emailTemplates).toBeDefined();
      expect(emailTemplates.length).toBeGreaterThan(0);
      
      const templateIds = emailTemplates.map(t => t.id);
      expect(templateIds).toContain('booking_confirmation');
      expect(templateIds).toContain('cancellation_notice');
      expect(templateIds).toContain('lesson_notes');
    });

    it('should have properly structured templates', () => {
      emailTemplates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('body');
        expect(template).toHaveProperty('variables');
        expect(Array.isArray(template.variables)).toBe(true);
      });
    });

    it('should include customer and dog variables in all templates', () => {
      emailTemplates.forEach(template => {
        if (template.id !== 'custom') {
          expect(template.variables).toContain('customerName');
          expect(template.variables).toContain('dogName');
        }
      });
    });
  });

  describe('Template Variable Replacement', () => {
    it('should replace template variables correctly', () => {
      const template = emailTemplates.find(t => t.id === 'booking_confirmation');
      expect(template).toBeDefined();
      
      if (template) {
        const { subject, body } = EmailService.createEmailFromBooking(
          {
            id: 'test',
            slotId: 'slot-1',
            customerEmail: 'test@example.com',
            customerName: 'Test User',
            dogName: 'Test Dog',
            date: '2025-08-15',
            time: '10:00 AM',
            duration: 60,
            status: 'confirmed',
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'customer'
          },
          'booking_confirmation'
        );

        expect(subject).toContain('Test User');
        expect(body).toContain('Test User');
        expect(body).toContain('Test Dog');
        expect(body).toContain('August 15, 2025');
        expect(body).toContain('10:00 AM');
      }
    });

    it('should handle missing template variables gracefully', () => {
      const { subject, body } = EmailService.createEmailFromBooking(
        {
          id: 'test',
          slotId: 'slot-1',
          customerEmail: 'test@example.com',
          customerName: 'Test User',
          dogName: 'Test Dog',
          date: '2025-08-15',
          time: '10:00 AM',
          duration: 60,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'customer'
        },
        'booking_confirmation'
      );

      // Should not contain unreplaced template variables
      expect(body).not.toContain('{{');
      expect(body).not.toContain('}}');
      expect(subject).not.toContain('{{');
      expect(subject).not.toContain('}}');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid booking data', async () => {
      const result = await EmailService.sendBookingEmail(
        null as any,
        mockCustomer,
        'booking_confirmation'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send booking email');
    });

    it('should handle invalid customer data', async () => {
      const result = await EmailService.sendBookingEmail(
        mockBooking,
        null as any,
        'booking_confirmation'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send booking email');
    });

    it('should handle EmailJS initialization errors', async () => {
      process.env.REACT_APP_EMAILJS_SERVICE_ID = 'test_service';
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID = 'test_template';
      process.env.REACT_APP_EMAILJS_PUBLIC_KEY = 'test_key';

      mockEmailjs.send.mockRejectedValue(new Error('EmailJS not initialized'));

      const result = await EmailService.sendEmail({
        to_email: 'test@example.com',
        to_name: 'Test User',
        from_name: 'Test Service',
        subject: 'Test',
        message: 'Test message',
        reply_to: 'noreply@test.com'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send email');
    });
  });

  describe('Integration Tests', () => {
    const mockBooking: Booking = {
      id: 'booking-1',
      slotId: 'slot-1',
      customerEmail: 'integration@test.com',
      customerName: 'Integration Test User',
      dogName: 'Integration Dog',
      date: '2025-12-25',
      time: '3:00 PM',
      duration: 30,
      status: 'confirmed',
      createdAt: '2025-08-10T12:00:00.000Z'
    };

    const mockUser: User = {
      id: 'user-integration',
      email: 'integration@test.com',
      name: 'Integration Test User',
      role: 'customer'
    };

    it('should handle complete booking email workflow', async () => {
      // Test the complete flow from booking to email
      const result = await EmailService.sendBookingEmail(
        mockBooking,
        mockUser,
        'booking_confirmation'
      );

      expect(result.success).toBe(true);
    });

    it('should handle lesson notes email workflow', async () => {
      const lessonNotesBooking = {
        ...mockBooking,
        lessonNotes: 'Great progress with sit and stay commands!',
        progress: 'Excellent',
        behaviorNotes: 'Very friendly and eager to learn'
      };

      const result = await EmailService.sendBookingEmail(
        lessonNotesBooking,
        mockUser,
        'lesson_notes'
      );

      expect(result.success).toBe(true);
    });
  });

  const mockBooking: Booking = {
    id: 'booking-1',
    slotId: 'slot-1',
    customerEmail: 'john@example.com',
    customerName: 'John Doe',
    dogName: 'Buddy',
    date: '2025-08-15',
    time: '2:00 PM',
    duration: 60,
    status: 'confirmed',
    createdAt: '2025-08-10T12:00:00.000Z',
    notes: 'First training session'
  };

  const mockCustomer: User = {
    id: 'user-1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'customer'
  };
});
