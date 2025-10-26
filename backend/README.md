# 🔧 CGCS Backend - API NestJS

## 📚 Documentation API

**Swagger UI** : http://localhost:3001/api/docs

## 🏗️ Architecture

```
src/
├── auth/                   # Module authentification
│   ├── auth.controller.ts  # Routes API
│   ├── auth.service.ts     # Logique métier
│   ├── dto/                # Data Transfer Objects
│   ├── guards/             # Guards (JWT, Roles)
│   ├── strategies/         # Passport strategies
│   └── decorators/         # Decorators personnalisés
├── prisma/                 # Service Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts           # Module racine
└── main.ts                 # Entry point
```

## 🔐 Endpoints disponibles

### Authentification

#### POST `/api/auth/register`
Créer un nouveau compte utilisateur.

**Body** :
```json
{
  "email": "chef@centre.cg",
  "password": "password123",
  "nom": "Dupont",
  "prenom": "Jean",
  "telephone": "+242 06 123 45 67",
  "role": "CHEF_CENTRE",
  "centreId": "uuid",
  "regisseurId": "uuid"
}
```

**Response** :
```json
{
  "message": "Compte créé avec succès",
  "user": {
    "id": "uuid",
    "email": "chef@centre.cg",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "CHEF_CENTRE"
  }
}
```

---

#### POST `/api/auth/login`
Se connecter et obtenir un JWT.

**Body** :
```json
{
  "email": "admin@cgcs.cg",
  "password": "admin123"
}
```

**Response** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@cgcs.cg",
    "nom": "Admin",
    "prenom": "Central",
    "role": "ADMIN",
    "centreId": null,
    "regisseurId": null
  }
}
```

---

#### GET `/api/auth/profile`
Obtenir le profil de l'utilisateur connecté.

**Headers** :
```
Authorization: Bearer <jwt-token>
```

**Response** :
```json
{
  "id": "uuid",
  "email": "admin@cgcs.cg",
  "nom": "Admin",
  "prenom": "Central",
  "role": "ADMIN",
  "centre": null,
  "regisseur": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-15T10:30:00.000Z"
}
```

## 🗄️ Base de données

### Modèles principaux

#### User
```prisma
model User {
  id          String      @id @default(uuid())
  email       String      @unique
  password    String      // Hash bcrypt
  nom         String
  prenom      String
  telephone   String?
  role        RoleType    // ADMIN | REGISSEUR | CHEF_CENTRE
  statut      StatutUser  // ACTIF | INACTIF | SUSPENDU
  centreId    String?
  regisseurId String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  lastLogin   DateTime?
}
```

#### Centre
```prisma
model Centre {
  id          String   @id @default(uuid())
  code        String   @unique  // CS-0001
  nom         String
  region      String
  regisseurId String?
  actif       Boolean  @default(true)
}
```

#### Regisseur
```prisma
model Regisseur {
  id      String   @id @default(uuid())
  code    String   @unique  // REG-001
  nom     String
  prenom  String
  email   String   @unique
  region  String
  actif   Boolean  @default(true)
}
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

## 🔧 Scripts Prisma

```bash
# Générer Prisma Client
npm run prisma:generate

# Créer une migration
npm run prisma:migrate

# Ouvrir Prisma Studio
npm run prisma:studio

# Seed la base de données
npm run prisma:seed
```

## 🔐 Sécurité

### JWT
- **Secret** : Configurable via `JWT_SECRET`
- **Expiration** : 24h (configurable via `JWT_EXPIRATION`)
- **Algorithm** : HS256

### Passwords
- **Hashing** : bcrypt avec 10 rounds
- **Validation** : Min. 8 caractères

### Guards
- **JwtAuthGuard** : Protège les routes authentifiées
- **RolesGuard** : Vérifie les rôles requis

Exemple :
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
@Get('admin-only')
async adminRoute() {
  // Accessible uniquement par ADMIN
}
```

## 📝 Audit Logs

Toutes les actions importantes sont loggées dans `audit_actions` :
- LOGIN / LOGOUT
- CREATE / UPDATE / DELETE
- VALIDATE / REJECT
- EXPORT / IMPORT

## 🚀 Déploiement

### Variables d'environnement requises

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="24h"
PORT=3001
NODE_ENV=production
```

### Build

```bash
npm run build
npm run start:prod
```

## 📊 Performance

- **Response time** : < 300ms (objectif)
- **Connexions DB** : Pool de 10 connexions
- **Rate limiting** : À implémenter (Module 4)

## 🔄 Prochaines étapes

- [ ] Module 2 : Budgets API
- [ ] Module 3 : Ordres de Paiement API
- [ ] Rate limiting
- [ ] Logs avancés (Winston + Loki)
- [ ] Monitoring (Prometheus)

