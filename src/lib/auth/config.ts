import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
// import { DrizzleAdapter } from '@auth/drizzle-adapter';
// import { db } from '@/lib/db';
// import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
// import bcrypt from 'bcryptjs'; // Será usado quando implementarmos verificação real de senha
import { z } from 'zod';

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Adapter temporariamente desabilitado devido a conflitos de tipos
  // Será reconfigurado na próxima iteração
  // adapter: DrizzleAdapter(db, {
  //   usersTable: users,
  //   accountsTable: accounts,
  //   sessionsTable: sessions,
  //   verificationTokensTable: verificationTokens,
  // }),
  providers: [
    // Provider de credenciais (email + senha)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validar entrada
          const { email, password } = loginSchema.parse(credentials);
          
          // TODO: Implementar busca no banco quando adapter estiver configurado
          // const user = await db.query.users.findFirst({
          //   where: (users, { eq }) => eq(users.email, email),
          // });

          // Placeholder para desenvolvimento
          if (email === 'admin@arafacriou.com.br' && password === 'admin123') {
            return {
              id: '1',
              email: email,
              name: 'Admin',
              role: 'admin',
            };
          }

          throw new Error('Credenciais inválidas');
        } catch (error) {
          console.error('Erro na autenticação:', error);
          return null;
        }
      },
    }),

    // Provider de magic link (email)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // TODO: Configurar template personalizado de magic link
    }),
  ],

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // Redirect após login para área apropriada baseada no role
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.AUTH_SECRET,
});