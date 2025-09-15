import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        // Temporary hardcoded user for testing
        if (credentials?.email === 'admin@arafacriou.com.br' && credentials?.password === 'admin123') {
          return {
            id: '1',
            email: 'admin@arafacriou.com.br',
            name: 'Admin',
            role: 'admin',
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
});

export { handler as GET, handler as POST };