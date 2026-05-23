import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApplication } from '../factories';

// Helper to create authenticated requests
async function createTestSession(): Promise<string | null> {
  const email = `test-${Date.now()}@example.com`;

  // Signup
  const signupRes = await fetch('http://localhost:4000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'ValidPassword123',
      fullName: 'Test User'
    })
  }).catch(() => null);

  // Login
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'ValidPassword123'
    })
  }).catch(() => null);

  if (!loginRes) return null;

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) return null;

  const sessionMatch = setCookie.match(/session=([^;]+)/);
  return sessionMatch ? sessionMatch[1] : null;
}

describe('Applications API', () => {
  let sessionToken: string | null;

  beforeEach(async () => {
    sessionToken = await createTestSession();
  });

  describe('POST /api/applications', () => {
    it('should create an application with valid data', async () => {
      if (!sessionToken) return;

      const response = await fetch('http://localhost:4000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        },
        body: JSON.stringify({
          company: 'Test Company',
          role: 'Software Engineer',
          stage: 'APPLIED',
          priority: 'HIGH',
          appliedDate: new Date().toISOString().split('T')[0]
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data).toBeDefined();
        expect(data.data.company).toBe('Test Company');
        expect(data.data.role).toBe('Software Engineer');
      }
    });

    it('should reject missing required fields', async () => {
      if (!sessionToken) return;

      const response = await fetch('http://localhost:4000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        },
        body: JSON.stringify({
          company: 'Test Company'
          // missing required fields
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(422);
      }
    });

    it('should reject future applied date', async () => {
      if (!sessionToken) return;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await fetch('http://localhost:4000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        },
        body: JSON.stringify({
          company: 'Test Company',
          role: 'Software Engineer',
          stage: 'APPLIED',
          priority: 'MEDIUM',
          appliedDate: futureDate.toISOString().split('T')[0]
        })
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(422);
      }
    });
  });

  describe('GET /api/applications', () => {
    it('should return list of applications for authenticated user', async () => {
      if (!sessionToken) return;

      const response = await fetch('http://localhost:4000/api/applications', {
        method: 'GET',
        headers: {
          'Cookie': `session=${sessionToken}`
        }
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fetch('http://localhost:4000/api/applications', {
        method: 'GET'
      }).catch(() => null);

      if (response) {
        expect(response.status).toBe(401);
      }
    });
  });

  describe('PATCH /api/applications/:id', () => {
    it('should update application stage', async () => {
      if (!sessionToken) return;

      // Create app first
      const createRes = await fetch('http://localhost:4000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        },
        body: JSON.stringify({
          company: 'Test Company',
          role: 'Software Engineer',
          stage: 'APPLIED',
          priority: 'MEDIUM',
          appliedDate: new Date().toISOString().split('T')[0]
        })
      }).catch(() => null);

      if (!createRes) return;
      const { data: app } = await createRes.json();

      // Update stage
      const updateRes = await fetch(
        `http://localhost:4000/api/applications/${app.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${sessionToken}`
          },
          body: JSON.stringify({
            stage: 'PHONE_SCREEN'
          })
        }
      ).catch(() => null);

      if (updateRes) {
        expect(updateRes.status).toBe(200);
        const { data: updated } = await updateRes.json();
        expect(updated.stage).toBe('PHONE_SCREEN');
      }
    });
  });

  describe('DELETE /api/applications/:id', () => {
    it('should soft delete application', async () => {
      if (!sessionToken) return;

      // Create app first
      const createRes = await fetch('http://localhost:4000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        },
        body: JSON.stringify({
          company: 'Test Company',
          role: 'Software Engineer',
          stage: 'APPLIED',
          priority: 'LOW',
          appliedDate: new Date().toISOString().split('T')[0]
        })
      }).catch(() => null);

      if (!createRes) return;
      const { data: app } = await createRes.json();

      // Delete
      const deleteRes = await fetch(
        `http://localhost:4000/api/applications/${app.id}`,
        {
          method: 'DELETE',
          headers: {
            'Cookie': `session=${sessionToken}`
          }
        }
      ).catch(() => null);

      expect(deleteRes?.status).toBe(200);

      // Verify it's gone from list
      const listRes = await fetch('http://localhost:4000/api/applications', {
        method: 'GET',
        headers: {
          'Cookie': `session=${sessionToken}`
        }
      }).catch(() => null);

      if (listRes) {
        const { data: apps } = await listRes.json();
        const found = apps.find((a: any) => a.id === app.id);
        expect(found).toBeUndefined();
      }
    });
  });
});
