import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { apiClient } from './api-client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Dans Docker, utiliser le nom du service 'backend' au lieu de 'localhost'
          const apiUrl = 'http://backend:3001/api';
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (data && data.access_token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: `${data.user.prenom} ${data.user.nom}`,
              role: data.user.role,
              centreId: data.user.centreId,
              regisseurId: data.user.regisseurId,
              accessToken: data.access_token,
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.centreId = user.centreId;
        token.regisseurId = user.regisseurId;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.centreId = token.centreId as string | null;
        session.user.regisseurId = token.regisseurId as string | null;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

