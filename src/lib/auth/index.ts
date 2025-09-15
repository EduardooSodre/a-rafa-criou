// Re-export auth functions for easier imports
export { auth, signIn, signOut } from './config';
import { auth } from './config';

// Utility functions for authentication
export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session.user;
}

export async function requireRole(role: string) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Role ${role} required`);
  }
  return user;
}

export async function requireAdmin() {
  return await requireRole('admin');
}

// Types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  image?: string | null;
}

declare module 'next-auth' {
  interface Session {
    user: User;
  }

  interface User {
    role: string;
  }
}