import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';

// Mock the pool
jest.mock('../../server', () => ({
  pool: {
    query: jest.fn()
  }
}));

import { pool } from '../../server';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new customer successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        dog_name: 'Buddy'
      };

      // Mock database queries
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert new user

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          role: 'customer',
          dogName: 'Buddy',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        dogName: 'Buddy'
      });
    });

    it('should reject registration with existing email', async () => {
      // Mock existing user
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          name: 'Test User',
          role: 'customer',
          dogName: 'Buddy',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login existing user with correct password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        dog_name: 'Buddy',
        password_hash: '$2b$10$hash' // Would be actual bcrypt hash
      };

      // Mock bcrypt compare
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        dogName: 'Buddy'
      });
    });

    it('should reject login with incorrect password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: '$2b$10$hash'
      };

      // Mock bcrypt compare to return false
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate required fields for login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      (pool.query as jest.Mock)
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          role: 'customer',
          dogName: 'Buddy',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Registration failed');
    });
  });
});
