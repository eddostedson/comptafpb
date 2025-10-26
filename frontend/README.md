# 💻 CGCS Frontend - Next.js 15

## 🎨 Stack Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **NextAuth.js** (authentification)
- **Sonner** (notifications)
- **Framer Motion** (animations)

## 📁 Structure

```
src/
├── app/                        # App Router
│   ├── login/                  # Page de connexion
│   ├── register/               # Page d'inscription
│   ├── dashboard/              # Dashboard principal
│   ├── api/auth/[...nextauth]/ # API NextAuth
│   ├── layout.tsx              # Layout global
│   ├── page.tsx                # Page d'accueil (→ login)
│   └── globals.css             # Styles globaux
├── components/
│   ├── ui/                     # Composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── label.tsx
│   ├── dashboard/              # Composants dashboard
│   │   ├── dashboard-admin.tsx
│   │   ├── dashboard-regisseur.tsx
│   │   ├── dashboard-chef.tsx
│   │   └── dashboard-layout.tsx
│   └── providers/
│       └── auth-provider.tsx   # Provider NextAuth
├── lib/
│   ├── auth.ts                 # Configuration NextAuth
│   ├── api-client.ts           # Axios client
│   └── utils.ts                # Utilitaires (cn, etc.)
└── types/
    └── next-auth.d.ts          # Types NextAuth

```

## 🔐 Authentification

### NextAuth.js

Configuration dans `src/lib/auth.ts` :
- **Provider** : Credentials (email/password)
- **Session** : JWT (24h)
- **Callbacks** : JWT et Session enrichis avec role, centreId, regisseurId

### Hooks disponibles

```tsx
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  // session.user.role
  // session.user.centreId
  // session.accessToken
}
```

### Pages protégées

```tsx
// Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

## 🎨 Design System

### Couleurs

```css
--primary: 217 91% 60%        /* Bleu principal */
--secondary: 210 40% 96.1%    /* Gris clair */
--accent: 210 40% 96.1%       /* Accent */
--destructive: 0 84.2% 60.2%  /* Rouge erreur */
```

### Composants UI

Tous les composants sont dans `src/components/ui/` et suivent les conventions shadcn/ui.

Exemple d'utilisation :

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Titre</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Cliquez-moi</Button>
      </CardContent>
    </Card>
  );
}
```

## 📱 Pages principales

### `/login`
- Formulaire de connexion
- Comptes de test affichés
- Redirection vers `/dashboard` après connexion

### `/register`
- Formulaire d'inscription
- Validation côté client
- Redirection vers `/login` après création

### `/dashboard`
- Redirection automatique par rôle :
  - **ADMIN** → `DashboardAdmin`
  - **REGISSEUR** → `DashboardRegisseur`
  - **CHEF_CENTRE** → `DashboardChef`

## 🔌 API Client

### Configuration

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const response = await apiClient.get('/endpoint');

// POST request
const response = await apiClient.post('/endpoint', data);

// Avec authentification
import { getSession } from 'next-auth/react';

const session = await getSession();
const response = await apiClient.get('/protected', {
  headers: {
    Authorization: `Bearer ${session.accessToken}`
  }
});
```

### Interceptors

- **Request** : Ajoute automatiquement le token JWT
- **Response** : Redirige vers `/login` si 401

## 🧪 Tests

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Build (vérifie que tout compile)
npm run build
```

## 🚀 Déploiement

### Variables d'environnement

```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
```

### Build & Start

```bash
npm run build
npm run start
```

### Vercel (recommandé)

```bash
vercel deploy
```

## 🎨 Personnalisation des couleurs

Modifier `src/app/globals.css` :

```css
:root {
  --primary: 217 91% 60%;  /* Votre couleur */
}
```

## 📊 Performance

- **Server Components** par défaut
- **Client Components** uniquement si nécessaire (`"use client"`)
- **Images optimisées** avec `next/image`
- **Fonts optimisées** avec `next/font`

## 🔄 Prochaines étapes

- [ ] Module 2 : Pages Budgets
- [ ] Module 3 : Pages OP
- [ ] Module 5 : Graphiques Chart.js
- [ ] PWA (Module 11)

## 🆘 Aide

### Erreur : Session non trouvée

```bash
# Vérifier NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET

# Supprimer les cookies
# Ouvrir DevTools → Application → Cookies → Supprimer tout
```

### Erreur : API non accessible

```bash
# Vérifier NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# Vérifier que le backend est démarré
curl http://localhost:3001/api/health
```

