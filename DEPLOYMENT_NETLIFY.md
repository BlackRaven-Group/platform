# Déploiement Netlify - BlackRaven

## Architecture

Le projet utilise **un seul build** qui s'adapte automatiquement au domaine :

| Domaine | Comportement |
|---------|-------------|
| `blackraven.fr` | Site vitrine public (landing page professionnelle) |
| `op.blackraven.fr` | Site opérationnel protégé par Master Poulet |
| `localhost` | Mode développement (comportement opérationnel) |

## Système de Protection "Master Poulet" 🍗

Sur `op.blackraven.fr`, les visiteurs doivent "commander un poulet" :
- **🔥 Bien Cuit** → Accès accordé au site opérationnel
- **🥩 Mi-Cuit** → Bannissement permanent (stocké dans localStorage)

## Déploiement sur Netlify - Guide Manuel

### Étape 1 : Importer le repository GitHub

1. Aller sur https://app.netlify.com
2. Cliquer sur **"Add new project"** → **"Import an existing project"**
3. Cliquer sur **"GitHub"** et autoriser l'accès si nécessaire
4. Rechercher et sélectionner le repository : **`BlackRaven-Group/platform`**
5. Cliquer sur **"Import"**

### Étape 2 : Configurer le Build

Dans la section **"Configure build"** :

- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Base directory** : (laisser vide)

⚠️ **Important** : Ne pas cliquer sur "Deploy" tout de suite, on configure d'abord les variables d'environnement.

### Étape 3 : Ajouter les variables d'environnement

1. Cliquer sur **"Show advanced"** ou **"Environment variables"**
2. Ajouter chaque variable une par une :

   | Variable | Valeur |
   |----------|--------|
   | `VITE_SUPABASE_URL` | `https://[votre-projet].supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `[votre-clé-anon]` |
   | `RESEND_API_KEY` | `[votre-clé-resend]` |
   | `SITE_PGP_ENCRYPTED_PRIVATE_KEY` | `[votre-clé-pgp]` |
   | `BROWSERLESS_API_KEY` | `[votre-clé-browserless]` |

3. Cliquer sur **"Deploy site"**

### Étape 4 : Configurer les domaines personnalisés

Une fois le déploiement terminé :

1. Aller dans **Site settings** → **Domain management**
2. Cliquer sur **"Add custom domain"**
3. Entrer `blackraven.fr` et suivre les instructions DNS
4. Cliquer à nouveau sur **"Add custom domain"**
5. Entrer `op.blackraven.fr` et suivre les instructions DNS

### Option 1 : Un seul site avec deux domaines (Recommandé)

1. **Créer un nouveau site sur Netlify**
   - Connecter le repository GitHub : `BlackRaven-Group/platform`
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Configurer les domaines**
   - Aller dans **Site settings** → **Domain management**
   - Ajouter `blackraven.fr` comme domaine principal
   - Ajouter `op.blackraven.fr` comme alias

3. **Configurer les variables d'environnement**
   
   Aller dans **Site settings → Environment variables** et ajouter :
   
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
   RESEND_API_KEY=votre-clé-resend
   SITE_PGP_ENCRYPTED_PRIVATE_KEY=votre-clé-pgp-encryptée
   BROWSERLESS_API_KEY=votre-clé-browserless
   ```

### Option 2 : Deux sites Netlify séparés (recommandé pour plus de contrôle)

#### Site 1 : blackraven.fr (vitrine)
1. Créer un site dédié pour la vitrine
2. Même configuration de build
3. Domaine personnalisé : `blackraven.fr`

#### Site 2 : op.blackraven.fr (opérationnel)
1. Créer un second site
2. Même configuration de build
3. Domaine personnalisé : `op.blackraven.fr`

## Configuration DNS (chez votre registrar)

```
# Pour blackraven.fr
Type: CNAME (ou A selon Netlify)
Name: @
Value: [votre-site].netlify.app

# Pour op.blackraven.fr
Type: CNAME
Name: op
Value: [votre-site-op].netlify.app
```

## Variables d'environnement requises

| Variable | Description | Où trouver |
|----------|-------------|------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | Dashboard Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase (anon key) | Dashboard Supabase → Settings → API |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi d'emails | Dashboard Resend → API Keys |
| `SITE_PGP_ENCRYPTED_PRIVATE_KEY` | Clé privée PGP encryptée du site | Générée avec pgpkeygen.com |
| `BROWSERLESS_API_KEY` | Clé API Browserless pour le scraping | Dashboard Browserless |

## Tester en local

```bash
# Mode normal (localhost = opérationnel avec Master Poulet)
npm run dev

# Pour simuler le mode vitrine, modifiez temporairement getSiteMode() dans App.tsx
```

## Sécurité

- Le bannissement "Mi-Cuit" est stocké en localStorage (`mp_banned`)
- L'accès "Bien Cuit" est stocké en localStorage (`mp_access_granted`)
- Ces valeurs peuvent être effacées par l'utilisateur (localStorage.clear())
- Pour une sécurité renforcée, envisagez d'ajouter un tracking côté serveur

## Notes importantes

1. **HTTPS** : Netlify gère automatiquement les certificats SSL
2. **CDN** : Les assets sont distribués via le CDN de Netlify
3. **SPA Redirects** : Configuré dans `netlify.toml` et `public/_redirects`
