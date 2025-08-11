import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from './auth';
import jwt from 'jsonwebtoken';

// Mock JWT
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'customer' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwt.verify.mockReturnValue(mockUser as any);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET || 'fallback-secret');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request with no authorization header', () => {
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed bearer token', () => {
      mockRequest.headers = { authorization: 'Bearer' };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', () => {
      mockRequest.headers = { authorization: 'Bearer expired-token' };
      mockJwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle JWT verification errors gracefully', () => {
      mockRequest.headers = { authorization: 'Bearer malformed-token' };
      mockJwt.verify.mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      // Set up authenticated user
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'customer' };
    });

    it('should allow access when user has required role', () => {
      const middleware = requireRole('customer');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has owner role (admin access)', () => {
      mockRequest.user!.role = 'owner';
      const middleware = requireRole('customer');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      mockRequest.user!.role = 'customer';
      const middleware = requireRole('owner');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: 'Insufficient permissions. Required role: owner' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;
      const middleware = requireRole('customer');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: 'Insufficient permissions. Required role: customer' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user has invalid role', () => {
      mockRequest.user!.role = 'invalid' as any;
      const middleware = requireRole('customer');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: 'Insufficient permissions. Required role: customer' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple required roles correctly', () => {
      // Test with custom role checking if the middleware supports it
      mockRequest.user!.role = 'admin';
      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with chained middleware', () => {
      const mockUser = { id: '1', email: 'owner@example.com', role: 'owner' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwt.verify.mockReturnValue(mockUser as any);

      // First authenticate
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRequest.user).toEqual(mockUser);

      // Then check role
      const roleMiddleware = requireRole('owner');
      roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should fail gracefully with invalid token in chained middleware', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Authentication should fail
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();

      // Role check should not be reached, but if called should also fail
      const roleMiddleware = requireRole('owner');
      roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Environment Variables', () => {
    const originalEnv = process.env.JWT_SECRET;

    afterEach(() => {
      process.env.JWT_SECRET = originalEnv;
    });

    it('should use JWT_SECRET from environment when available', () => {
      process.env.JWT_SECRET = 'test-secret';
      const mockUser = { id: '1', email: 'test@example.com', role: 'customer' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwt.verify.mockReturnValue(mockUser as any);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should use fallback secret when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const mockUser = { id: '1', email: 'test@example.com', role: 'customer' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwt.verify.mockReturnValue(mockUser as any);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'fallback-secret');
    });
  });
});
