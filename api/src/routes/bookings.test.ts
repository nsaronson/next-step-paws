import request from 'supertest';
import express from 'express';
import { bookingsRouter } from './bookings';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import jwt from 'jsonwebtoken';

// Mock the middleware
jest.mock('../middleware/auth');
jest.mock('../middleware/validation');
jest.mock('jsonwebtoken');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockValidateRequest = validateRequest as jest.MockedFunction<typeof validateRequest>;

// Mock in-memory data store
let mockBookings: any[] = [];

// Mock the data access functions
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => JSON.stringify(mockBookings)),
  writeFileSync: jest.fn((path: string, data: string) => {
    mockBookings = JSON.parse(data);
  }),
  existsSync: jest.fn(() => true)
}));

describe('Bookings API Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock middleware to always pass
    mockAuthenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: '1', email: 'test@example.com', role: 'customer' };
      next();
    });
    
    mockRequireRole.mockImplementation((role) => (req, res, next) => {
      next();
    });
    
    mockValidateRequest.mockImplementation((schema) => (req, res, next) => {
      next();
    });

    app.use('/bookings', bookingsRouter);
  });

  beforeEach(() => {
    // Reset mock data
    mockBookings = [
      {
        id: 'booking-1',
        slotId: 'slot-1',
        customerEmail: 'john@example.com',
        customerName: 'John Doe',
        dogName: 'Buddy',
        date: '2025-08-15',
        time: '10:00 AM',
        duration: 60,
        status: 'confirmed',
        createdAt: '2025-08-10T12:00:00.000Z',
        notes: 'First session'
      },
      {
        id: 'booking-2',
        slotId: 'slot-2',
        customerEmail: 'jane@example.com',
        customerName: 'Jane Smith',
        dogName: 'Max',
        date: '2025-08-16',
        time: '2:00 PM',
        duration: 30,
        status: 'pending',
        createdAt: '2025-08-10T14:00:00.000Z'
      }
    ];
    jest.clearAllMocks();
  });

  describe('GET /bookings', () => {
    it('should return all bookings for owner', async () => {
      mockRequireRole.mockImplementation((role) => (req, res, next) => {
        if (role === 'owner') {
          req.user = { id: '1', email: 'owner@example.com', role: 'owner' };
        }
        next();
      });

      const response = await request(app)
        .get('/bookings')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'booking-1');
      expect(response.body[1]).toHaveProperty('id', 'booking-2');
    });

    it('should return user-specific bookings for customers', async () => {
      mockRequireRole.mockImplementation((role) => (req, res, next) => {
        req.user = { id: '1', email: 'john@example.com', role: 'customer' };
        next();
      });

      const response = await request(app)
        .get('/bookings')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('customerEmail', 'john@example.com');
    });

    it('should return empty array when no bookings exist', async () => {
      mockBookings = [];

      const response = await request(app)
        .get('/bookings')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle file read errors gracefully', async () => {
      const fs = require('fs');
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const response = await request(app)
        .get('/bookings')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /bookings', () => {
    const validBookingData = {
      slotId: 'slot-3',
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      dogName: 'Charlie',
      date: '2025-08-17',
      time: '11:00 AM',
      duration: 60,
      notes: 'Aggressive behavior training'
    };

    it('should create a new booking successfully', async () => {
      const response = await request(app)
        .post('/bookings')
        .send(validBookingData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('slotId', 'slot-3');
      expect(response.body).toHaveProperty('status', 'confirmed');
      expect(response.body).toHaveProperty('createdAt');
      expect(mockBookings).toHaveLength(3);
    });

    it('should prevent double booking of the same slot', async () => {
      // Create booking with existing slot
      const duplicateBooking = {
        ...validBookingData,
        slotId: 'slot-1' // Existing slot
      };

      const response = await request(app)
        .post('/bookings')
        .send(duplicateBooking)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Time slot is already booked');
      expect(mockBookings).toHaveLength(2); // No new booking added
    });

    it('should handle missing required fields', async () => {
      mockValidateRequest.mockImplementation((schema) => (req, res, next) => {
        res.status(400).json({
          error: 'Validation error',
          details: ['customerName is required']
        });
      });

      const incompleteData = { ...validBookingData };
      delete incompleteData.customerName;

      await request(app)
        .post('/bookings')
        .send(incompleteData)
        .expect(400);
    });

    it('should generate unique booking IDs', async () => {
      const booking1 = await request(app)
        .post('/bookings')
        .send({ ...validBookingData, slotId: 'slot-3' })
        .expect(201);

      const booking2 = await request(app)
        .post('/bookings')
        .send({ ...validBookingData, slotId: 'slot-4' })
        .expect(201);

      expect(booking1.body.id).not.toBe(booking2.body.id);
    });

    it('should set default status to confirmed', async () => {
      const response = await request(app)
        .post('/bookings')
        .send(validBookingData)
        .expect(201);

      expect(response.body.status).toBe('confirmed');
    });

    it('should handle file write errors', async () => {
      const fs = require('fs');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('File write error');
      });

      await request(app)
        .post('/bookings')
        .send(validBookingData)
        .expect(500);
    });
  });

  describe('PUT /bookings/:id', () => {
    const updateData = {
      notes: 'Updated notes',
      status: 'confirmed'
    };

    it('should update an existing booking', async () => {
      const response = await request(app)
        .put('/bookings/booking-1')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'booking-1');
      expect(response.body).toHaveProperty('notes', 'Updated notes');
      expect(response.body).toHaveProperty('status', 'confirmed');
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .put('/bookings/non-existent')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Booking not found');
    });

    it('should prevent customers from updating other users bookings', async () => {
      mockRequireRole.mockImplementation((role) => (req, res, next) => {
        req.user = { id: '2', email: 'other@example.com', role: 'customer' };
        next();
      });

      const response = await request(app)
        .put('/bookings/booking-1')
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized to modify this booking');
    });

    it('should allow owners to update any booking', async () => {
      mockRequireRole.mockImplementation((role) => (req, res, next) => {
        req.user = { id: '1', email: 'owner@example.com', role: 'owner' };
        next();
      });

      await request(app)
        .put('/bookings/booking-1')
        .send(updateData)
        .expect(200);
    });

    it('should preserve unchanged fields', async () => {
      const response = await request(app)
        .put('/bookings/booking-1')
        .send({ notes: 'Only updating notes' })
        .expect(200);

      expect(response.body).toHaveProperty('customerName', 'John Doe');
      expect(response.body).toHaveProperty('dogName', 'Buddy');
      expect(response.body).toHaveProperty('notes', 'Only updating notes');
    });

    it('should validate status updates', async () => {
      mockValidateRequest.mockImplementation((schema) => (req, res, next) => {
        if (req.body.status && !['confirmed', 'pending', 'cancelled'].includes(req.body.status)) {
          return res.status(400).json({
            error: 'Validation error',
            details: ['Invalid status value']
          });
        }
        next();
      });

      await request(app)
        .put('/bookings/booking-1')
        .send({ status: 'invalid-status' })
        .expect(400);
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete an existing booking', async () => {
      await request(app)
        .delete('/bookings/booking-1')
        .expect(200);

      expect(mockBookings).toHaveLength(1);
      expect(mockBookings.find(b => b.id === 'booking-1')).toBeUndefined();
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .delete('/bookings/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Booking not found');
    });

    it('should prevent customers from deleting other users bookings', async () => {
      mockRequireRole.mockImplementation((role) => (req, res, next) => {
        req.user = { id: '2', email: 'other@example.com', role: 'customer' };
        next();
      });

      const response = await request(app)
        .delete('/bookings/booking-1')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized to delete this booking');
      expect(mockBookings).toHaveLength(2); // Booking should still exist
    });

    it('should allow owners to delete any booking', async () => {
      mockRequireRole.mockImplementation((role) => (req, res, next) => {
        req.user = { id: '1', email: 'owner@example.com', role: 'owner' };
        next();
      });

      await request(app)
        .delete('/bookings/booking-1')
        .expect(200);

      expect(mockBookings).toHaveLength(1);
    });
  });

  describe('Business Logic Tests', () => {
    it('should handle concurrent booking attempts', async () => {
      const bookingData = {
        ...{
          slotId: 'slot-concurrent',
          customerName: 'User 1',
          customerEmail: 'user1@example.com',
          dogName: 'Dog1',
          date: '2025-08-18',
          time: '3:00 PM',
          duration: 60
        }
      };

      const bookingData2 = {
        ...bookingData,
        customerName: 'User 2',
        customerEmail: 'user2@example.com',
        dogName: 'Dog2'
      };

      // Simulate concurrent requests
      const [response1, response2] = await Promise.all([
        request(app).post('/bookings').send(bookingData),
        request(app).post('/bookings').send(bookingData2)
      ]);

      // One should succeed, one should fail
      expect([response1.status, response2.status]).toContain(201);
      expect([response1.status, response2.status]).toContain(409);
    });

    it('should validate date is not in the past', async () => {
      mockValidateRequest.mockImplementation((schema) => (req, res, next) => {
        const requestDate = new Date(req.body.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (requestDate < today) {
          return res.status(400).json({
            error: 'Validation error',
            details: ['Cannot book appointments in the past']
          });
        }
        next();
      });

      const pastBooking = {
        slotId: 'slot-past',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '2020-01-01',
        time: '10:00 AM',
        duration: 60
      };

      await request(app)
        .post('/bookings')
        .send(pastBooking)
        .expect(400);
    });

    it('should handle timezone considerations for dates', async () => {
      const todayBooking = {
        slotId: 'slot-today',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        duration: 60
      };

      await request(app)
        .post('/bookings')
        .send(todayBooking)
        .expect(201);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency after multiple operations', async () => {
      const initialCount = mockBookings.length;

      // Create a booking
      await request(app)
        .post('/bookings')
        .send({
          slotId: 'slot-integrity',
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          dogName: 'TestDog',
          date: '2025-08-20',
          time: '9:00 AM',
          duration: 30
        })
        .expect(201);

      expect(mockBookings).toHaveLength(initialCount + 1);

      // Update the booking
      const newBooking = mockBookings[mockBookings.length - 1];
      await request(app)
        .put(`/bookings/${newBooking.id}`)
        .send({ notes: 'Integrity test notes' })
        .expect(200);

      expect(mockBookings).toHaveLength(initialCount + 1);
      expect(mockBookings.find(b => b.id === newBooking.id)?.notes).toBe('Integrity test notes');

      // Delete the booking
      await request(app)
        .delete(`/bookings/${newBooking.id}`)
        .expect(200);

      expect(mockBookings).toHaveLength(initialCount);
      expect(mockBookings.find(b => b.id === newBooking.id)).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', async () => {
      // This would typically be handled by express.json() middleware
      const response = await request(app)
        .post('/bookings')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});
