import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    centreId?: string | null;
    regisseurId?: string | null;
    accessToken: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      centreId?: string | null;
      regisseurId?: string | null;
    };
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    centreId?: string | null;
    regisseurId?: string | null;
    accessToken: string;
  }
}

