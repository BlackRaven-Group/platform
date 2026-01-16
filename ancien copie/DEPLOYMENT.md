# BlackRaven Valhalla - Guide de Déploiement

Ce projet est divisé en **deux applications distinctes** pour permettre un hébergement séparé :

## 1. Site Vitrine (Landing Page)
**Dossier:** `landing-page/`

### Description
Site vitrine statique sans connexion base de données.
Redirige vers l'application principale pour l'accès aux services.

### Installation
```bash
cd landing-page
npm install
```

### Build
```bash
npm run build
```

Les fichiers statiques seront dans `landing-page/dist/`.

### Configuration
Avant le build, modifiez les URLs dans `landing-page/src/App.tsx` :
```typescript
const handleAccessServices = () => {
  window.location.href = 'https://votre-domaine-app.com';
};

const handleAdminAccess = () => {
  window.location.href = 'https://votre-domaine-app.com/admin';
};
```

### Hébergement Recommandé
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Tout hébergeur de sites statiques

**Aucune base de données requise**

---

## 2. Application Principale (Services OSINT)
**Dossier:** Racine du projet

### Description
Application complète avec :
- Authentification client (inscription/connexion)
- Authentification admin (Supabase Auth)
- Base de données Supabase
- Services OSINT
- Gestion des dossiers
- Support et tickets

### Installation
```bash
npm install
```

### Configuration
Fichier `.env` requis :
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build
```bash
npm run build
```

### Base de Données
La base de données Supabase est déjà configurée avec :
- Tables clients (`client_users`, `client_sessions`)
- Tables admin (`user_profiles`, `roles`)
- Tables OSINT (`dossiers`, `targets`, etc.)
- Row Level Security (RLS)

### Hébergement Recommandé
- Vercel
- Netlify
- AWS Amplify
- Render
- Railway

**Base de données Supabase requise**

---

## Workflow Utilisateur

### Pour les Clients
1. Visite du site vitrine → `landing-page/`
2. Clic sur "ACCÈS SERVICES" ou "DEMANDER UNE PRESTATION"
3. Redirection vers l'application principale
4. **Première visite :** Inscription avec email/mot de passe
   - Le compte est créé avec statut "pending"
   - Attente d'approbation par un admin
5. **Après approbation :** Connexion et accès aux services
   - Soumettre des demandes via PGP ou GLPI
   - Suivre les prestations

### Pour les Admins
1. Visite du site vitrine → `landing-page/`
2. Clic sur "[ADMIN]"
3. Redirection vers l'application principale
4. Connexion avec Supabase Auth
5. Accès au dashboard admin :
   - Gérer les dossiers OSINT
   - Approuver les comptes clients
   - Gérer les tickets support
   - Accès à toutes les fonctionnalités

---

## Séparation des Authentifications

### Authentification Client
- **Table:** `client_users`
- **Type:** Custom (email/password hashé)
- **Sessions:** `client_sessions` avec tokens
- **Statut:** pending → active (après approbation admin)
- **Accès:** Services uniquement (soumettre demandes)

### Authentification Admin
- **Service:** Supabase Auth
- **Type:** Email/Password avec Supabase
- **Rôles:** super_admin, support
- **Accès:** Dashboard complet, gestion OSINT, approbation clients

---

## Approuver un Client (Admin)

Pour approuver un compte client en attente :

1. Connexion en tant qu'admin
2. Accès à la console Supabase ou créer une interface admin
3. Exécuter :
```sql
UPDATE client_users
SET status = 'active'
WHERE email = 'client@example.com';
```

Ou via l'application :
```typescript
await supabase
  .from('client_users')
  .update({ status: 'active' })
  .eq('email', 'client@example.com');
```

---

## Sécurité

### RLS (Row Level Security)
- Activé sur toutes les tables sensibles
- Les clients ne voient que leurs propres données
- Les admins ont accès complet via leurs rôles
- Sessions clients avec expiration automatique (7 jours)

### Mots de passe
- Hashés avec SHA-256 (à améliorer avec bcrypt côté serveur)
- Minimum 8 caractères requis
- Stockés dans `password_hash`

### Sessions
- Tokens uniques UUID
- Expiration automatique
- Nettoyage via fonction `cleanup_expired_client_sessions()`

---

## Déploiement Production

### Étape 1: Site Vitrine
```bash
cd landing-page
npm install
# Modifier les URLs dans src/App.tsx
npm run build
# Déployer le contenu de dist/ sur votre hébergeur
```

### Étape 2: Application Principale
```bash
# À la racine
npm install
# Configurer .env avec vos clés Supabase
npm run build
# Déployer le contenu de dist/ sur votre hébergeur
```

### Étape 3: Configuration DNS
- Site vitrine : `www.blackraven.com` ou `blackraven.com`
- Application : `app.blackraven.com`

---

## Support

Pour toute question :
- Email: support@blackraven.com
- Documentation: Ce fichier
- Base de données: Voir migrations dans `supabase/migrations/`
