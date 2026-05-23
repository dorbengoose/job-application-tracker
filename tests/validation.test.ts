import { describe, it, expect } from 'vitest';
import { CreateApplicationSchema, UpdateApplicationSchema } from '@/lib/validation/application-schemas';

describe('Application Schemas', () => {
  describe('CreateApplicationSchema', () => {
    it('should validate valid application data', () => {
      const validData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0],
        jobUrl: 'https://example.com/job/1',
        location: 'San Francisco',
        salaryMin: 100000,
        salaryMax: 150000,
        source: 'LinkedIn'
      };

      const result = CreateApplicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required company field', () => {
      const invalidData = {
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      const result = CreateApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required role field', () => {
      const invalidData = {
        company: 'Tech Corp',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      const result = CreateApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid stage enum', () => {
      const invalidData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'INVALID_STAGE',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      const result = CreateApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject future applied date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: futureDate.toISOString().split('T')[0]
      };

      const result = CreateApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL format', () => {
      const invalidData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0],
        jobUrl: 'not-a-valid-url'
      };

      const result = CreateApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject salaryMax less than salaryMin', () => {
      const invalidData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0],
        salaryMin: 150000,
        salaryMax: 100000
      };

      const result = CreateApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const validData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      const result = CreateApplicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow empty string for optional URL field', () => {
      const validData = {
        company: 'Tech Corp',
        role: 'Senior Developer',
        stage: 'APPLIED',
        priority: 'HIGH',
        appliedDate: new Date().toISOString().split('T')[0],
        jobUrl: ''
      };

      const result = CreateApplicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateApplicationSchema', () => {
    it('should allow partial updates', () => {
      const partialData = {
        stage: 'PHONE_SCREEN',
        priority: 'LOW'
      };

      const result = UpdateApplicationSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow updating single field', () => {
      const partialData = {
        stage: 'INTERVIEW'
      };

      const result = UpdateApplicationSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for update', () => {
      const partialData = {};

      const result = UpdateApplicationSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should still validate invalid enum values', () => {
      const partialData = {
        stage: 'INVALID_STAGE'
      };

      const result = UpdateApplicationSchema.safeParse(partialData);
      expect(result.success).toBe(false);
    });
  });
});
