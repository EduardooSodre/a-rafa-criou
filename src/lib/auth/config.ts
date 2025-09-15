import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciais não fornecidas');
          return null;
        }

        try {
          console.log('🔍 Buscando usuário:', credentials.email);
          
          // Buscar usuário no banco
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          console.log('👤 Usuários encontrados:', user.length);

          if (user.length === 0) {
            console.log('❌ Usuário não encontrado');
            return null;
          }

          const dbUser = user[0];
          console.log('✅ Usuário encontrado:', { id: dbUser.id, email: dbUser.email, hasPassword: !!dbUser.password });

          // Verificar senha
          if (!dbUser.password) {
            console.log('❌ Usuário sem senha no banco');
            return null;
          }

          console.log('🔐 Verificando senha...');
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            dbUser.password
          );

          console.log('✅ Senha válida:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Senha inválida');
            return null;
          }

          console.log('🎉 Login bem-sucedido para:', dbUser.email);
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || undefined,
            role: dbUser.role,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async session({ session, token }: any) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
