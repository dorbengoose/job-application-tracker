import type { JobApplication, User, Note } from '@prisma/client';

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    fullName: 'Test User',
    createdAt: new Date(),
    ...overrides
  };
}

export function createTestApplication(overrides?: Partial<JobApplication>): JobApplication {
  return {
    id: 'test-app-1',
    userId: 'test-user-1',
    company: 'Test Company',
    role: 'Senior Developer',
    stage: 'APPLIED',
    priority: 'MEDIUM',
    appliedDate: new Date(),
    jobUrl: 'https://example.com/job/1',
    location: 'San Francisco, CA',
    salaryMin: 100000,
    salaryMax: 150000,
    source: 'LinkedIn',
    contacts: '[]',
    documents: '{}',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createTestNote(overrides?: Partial<Note>): Note {
  return {
    id: 'test-note-1',
    applicationId: 'test-app-1',
    userId: 'test-user-1',
    content: 'This is a test note',
    createdAt: new Date(),
    ...overrides
  };
}
