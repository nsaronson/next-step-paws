import { Request, Response, NextFunction } from 'express';
import { validateRequest } from './validation';
import Joi from 'joi';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    const simpleSchema = Joi.object({
      name: Joi.string().required().min(2).max(50),
      email: Joi.string().email().required(),
      age: Joi.number().integer().min(0).max(120).optional()
    });

    it('should pass validation with valid data', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass validation with partial data when optional fields are missing', () => {
      mockRequest.body = {
        name: 'Jane Smith',
        email: 'jane@example.com'
        // age is optional
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation with missing required fields', () => {
      mockRequest.body = {
        name: 'John'
        // email is missing
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.stringMatching(/email.*required/i)
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email format', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'invalid-email-format',
        age: 30
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.stringMatching(/email.*valid/i)
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation with string length violations', () => {
      mockRequest.body = {
        name: 'J', // Too short
        email: 'john@example.com',
        age: 30
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.stringMatching(/name.*2 characters/i)
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation with numeric range violations', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5 // Invalid age
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.stringMatching(/age.*greater than or equal/i)
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      mockRequest.body = {
        name: '', // Too short
        email: 'invalid-email', // Invalid format
        age: 150 // Too old
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.details).toHaveLength(3);
      expect(responseCall.details).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/name/i),
          expect.stringMatching(/email/i),
          expect.stringMatching(/age/i)
        ])
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unexpected data types', () => {
      mockRequest.body = {
        name: 123, // Should be string
        email: 'john@example.com',
        age: 'thirty' // Should be number
      };

      const middleware = validateRequest(simpleSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Complex Schema Validation', () => {
    const bookingSchema = Joi.object({
      customerName: Joi.string().required().min(2).max(100),
      customerEmail: Joi.string().email().required(),
      dogName: Joi.string().required().min(1).max(50),
      date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
      time: Joi.string().pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/).required(),
      duration: Joi.number().valid(30, 60).required(),
      notes: Joi.string().max(500).optional().allow('')
    });

    it('should validate a complete booking request', () => {
      mockRequest.body = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '2025-08-15',
        time: '2:30 PM',
        duration: 60,
        notes: 'First training session'
      };

      const middleware = validateRequest(bookingSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid date format', () => {
      mockRequest.body = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '08/15/2025', // Invalid format
        time: '2:30 PM',
        duration: 60
      };

      const middleware = validateRequest(bookingSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid time format', () => {
      mockRequest.body = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '2025-08-15',
        time: '14:30', // Invalid format (24-hour)
        duration: 60
      };

      const middleware = validateRequest(bookingSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid duration values', () => {
      mockRequest.body = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '2025-08-15',
        time: '2:30 PM',
        duration: 45 // Invalid duration (only 30 or 60 allowed)
      };

      const middleware = validateRequest(bookingSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow empty notes', () => {
      mockRequest.body = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '2025-08-15',
        time: '2:30 PM',
        duration: 60,
        notes: ''
      };

      const middleware = validateRequest(bookingSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject notes that are too long', () => {
      mockRequest.body = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        dogName: 'Buddy',
        date: '2025-08-15',
        time: '2:30 PM',
        duration: 60,
        notes: 'A'.repeat(501) // Too long
      };

      const middleware = validateRequest(bookingSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    const schema = Joi.object({
      value: Joi.string().required()
    });

    it('should handle null request body', () => {
      mockRequest.body = null;

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined request body', () => {
      mockRequest.body = undefined;

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty object', () => {
      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.stringMatching(/value.*required/i)
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle extra unexpected fields gracefully', () => {
      const strictSchema = Joi.object({
        name: Joi.string().required()
      }).unknown(false); // Strict mode

      mockRequest.body = {
        name: 'John',
        unexpectedField: 'value'
      };

      const middleware = validateRequest(strictSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Schema Error Handling', () => {
    it('should handle malformed schemas gracefully', () => {
      const invalidSchema = null as any;

      expect(() => {
        validateRequest(invalidSchema);
      }).toThrow();
    });

    it('should provide clear error messages for validation failures', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
      });

      mockRequest.body = {
        email: 'not-an-email',
        password: '123'
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error).toBe('Validation error');
      expect(responseCall.details).toBeInstanceOf(Array);
      expect(responseCall.details.length).toBeGreaterThan(0);
    });
  });
});
