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
          // Déterminer l'URL de l'API selon l'environnement
          // Cette fonction s'exécute côté serveur (dans l'API route Next.js)
          // Utiliser NEXT_PUBLIC_API_URL si disponible, sinon localhost
          // Pour Docker, l'URL devrait être définie dans les variables d'environnement
          const apiUrl = process.env.API_URL_SERVER || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          
          // Normaliser l'URL (supprimer /api à la fin si présent)
          const normalizedUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
          
          console.log('[Auth] Tentative de connexion à:', normalizedUrl);
          
          const response = await fetch(`${normalizedUrl}/auth/login`, {
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
            const errorText = await response.text().catch(() => '');
            console.error('[Auth] Erreur HTTP:', response.status, response.statusText, errorText);
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
        } catch (error: any) {
          console.error('[Auth] Erreur de connexion:', error?.message || error);
          console.error('[Auth] Détails:', {
            code: error?.code,
            cause: error?.cause,
            stack: error?.stack,
          });
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

