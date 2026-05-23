import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
}

export async function getSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return session;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token }
  });
}

export async function getUserFromSession(request: Request): Promise<any | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const session = await getSession(token);
  return session?.user || null;
}
