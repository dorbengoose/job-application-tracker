import { z } from 'zod';

const baseSchema = z.object({
  company: z.string().min(1, 'Company is required').max(200),
  role: z.string().min(1, 'Role is required').max(200),
  stage: z.enum(['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  appliedDate: z.string().refine((d) => new Date(d) <= new Date(), {
    message: 'Applied date cannot be in the future'
  }),
  jobUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  source: z.string().max(100).optional()
});

export const CreateApplicationSchema = baseSchema.refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  { message: 'Max salary must be >= min salary', path: ['salaryMax'] }
);

export const UpdateApplicationSchema = baseSchema.partial().refine(
  (data) => !data.salaryMin || !data.salaryMax || !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  { message: 'Max salary must be >= min salary', path: ['salaryMax'] }
);

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
