export type {
  User,
  Session,
  JobApplication,
  Note,
  ApplicationEvent
} from '@prisma/client';

export type Contact = {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
};

export type Documents = {
  resumeUrl?: string;
  coverLetterUrl?: string;
  jobPostingUrl?: string;
};

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
