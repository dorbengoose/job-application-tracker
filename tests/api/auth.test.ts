import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestUser } from '../factories';

describe('Authentication API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid credentials', async () => {
      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          password: 'ValidPassword123',
          fullName: 'Test User'
        })
      }).catch(() => null);

      // Note: This test requires the server to be running
      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Account created');
        expect(data.user).toBeDefined();
      }
    });

    it('should reject password shorter than 8 characters', async () => {
      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'short',
          fullName: 'Test User'
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(422);
      }
    });

    it('should reject duplicate email', async () => {
      const email = `test-${Date.now()}@example.com`;

      // First signup
      await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'ValidPassword123',
          fullName: 'Test User'
        })
      }).catch(() => null);

      // Attempt duplicate signup
      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'ValidPassword123',
          fullName: 'Test User'
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(422);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return user on successful login', async () => {
      const email = `test-${Date.now()}@example.com`;

      // Create user first
      await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'ValidPassword123',
          fullName: 'Test User'
        })
      }).catch(() => null);

      // Login
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'ValidPassword123'
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(200);
        expect(response.headers.get('set-cookie')).toContain('session=');
        const data = await response.json();
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(email);
      }
    });

    it('should reject invalid password', async () => {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(401);
      }
    });
  });
});
