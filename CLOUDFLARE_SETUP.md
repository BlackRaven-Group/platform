# 🚀 Déploiement Cloudflare Pages - BlackRaven

## Avantages de Cloudflare Pages

- ✅ DNS déjà géré par Cloudflare (pas besoin de changer)
- ✅ CDN global intégré
- ✅ SSL automatique
- ✅ Variables d'environnement
- ✅ Déploiements automatiques depuis GitHub
- ✅ Gratuit pour les projets open source

## 📋 Configuration Cloudflare Pages

### Étape 1 : Connecter le Repository GitHub

1. Aller sur https://dash.cloudflare.com
2. Dans le menu de gauche, cliquer sur **"Pages"**
3. Cliquer sur **"Create a project"**
4. Cliquer sur **"Connect to Git"**
5. Sélectionner **GitHub** et autoriser l'accès si nécessaire
6. Rechercher et sélectionner le repository : **`BlackRaven-Group/platform`**
7. Cliquer sur **"Begin setup"**

### Étape 2 : Configuration du Build

Dans la section **"Configure build"** :

- **Project name** : `blackraven-platform` (ou le nom de votre choix)
- **Production branch** : `main`
- **Framework preset** : `Vite` (ou laisser vide)
- **Build command** : `npm run build`
- **Build output directory** : `dist`
- **Root directory** : (laisser vide)

### Étape 3 : Variables d'Environnement

Avant de déployer, cliquer sur **"Environment variables"** et ajouter :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://[votre-projet].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `[votre-clé-anon]` |
| `RESEND_API_KEY` | `[votre-clé-resend]` |
| `SITE_PGP_ENCRYPTED_PRIVATE_KEY` | `[votre-clé-pgp]` |
| `BROWSERLESS_API_KEY` | `[votre-clé-browserless]` |
| `VITE_GOOGLE_MAPS_API_KEY` | `[votre-clé-google-maps]` |

⚠️ **Important** : Les variables préfixées par `VITE_` sont accessibles côté client. Les autres sont uniquement pour les Edge Functions (si vous en utilisez).

### Étape 4 : Déployer

1. Cliquer sur **"Save and Deploy"**
2. Attendre que le build se termine (première fois : ~2-3 minutes)
3. Une fois terminé, vous obtiendrez une URL : `https://blackraven-platform.pages.dev`

### Étape 5 : Configurer le Domaine Personnalisé

1. Dans la page du projet, aller dans **"Custom domains"**
2. Cliquer sur **"Set up a custom domain"**
3. Entrer `blackraven.fr`
4. Cloudflare détectera automatiquement que le DNS est déjà géré par Cloudflare
5. Il proposera de créer automatiquement un enregistrement CNAME ou de le faire manuellement

**Option automatique** (recommandé) :
- Cloudflare créera automatiquement un CNAME pointant vers `blackraven-platform.pages.dev`

**Option manuelle** :
- Aller dans **DNS** → **Records**
- Créer un nouveau record :
  - **Type** : `CNAME`
  - **Name** : `@` (ou `blackraven.fr`)
  - **Target** : `blackraven-platform.pages.dev`
  - **Proxy status** : ✅ Proxied (orange cloud)

### Étape 6 : Vérifier le DNS

1. Aller dans **DNS** → **Records**
2. Vérifier qu'il y a un CNAME pour `blackraven.fr` pointant vers `blackraven-platform.pages.dev`
3. Le statut doit être **Proxied** (nuage orange)

## 🔧 Configuration des Redirects (SPA)

Cloudflare Pages utilise le fichier `_redirects` dans le dossier `public/` pour gérer les redirects SPA.

Le fichier `public/_redirects` contient déjà :
```
/*    /index.html   200
```

Cela garantit que toutes les routes redirigent vers `index.html` pour le routing côté client.

## 📝 Variables d'Environnement - Où trouver les valeurs ?

| Variable | Où trouver |
|----------|------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `SITE_PGP_ENCRYPTED_PRIVATE_KEY` | Générée avec pgpkeygen.com |
| `BROWSERLESS_API_KEY` | Browserless Dashboard → API Keys |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console → Credentials → API Keys |

## ✅ Après le déploiement

1. Vérifier que le build passe sans erreur
2. Tester `blackraven.fr` → doit afficher la landing page publique
3. Vérifier que les variables d'environnement sont bien chargées (console du navigateur)
4. Tester les fonctionnalités principales (login, map, etc.)

## 🔄 Déploiements Automatiques

Cloudflare Pages se connecte automatiquement à GitHub et déploie :
- **À chaque push sur `main`** → Déploiement en production
- **À chaque pull request** → Preview deployment (URL temporaire)

## 🆚 Cloudflare Pages vs Netlify

| Fonctionnalité | Cloudflare Pages | Netlify |
|----------------|------------------|---------|
| DNS intégré | ✅ Oui (si DNS géré par Cloudflare) | ❌ Non |
| CDN global | ✅ Oui | ✅ Oui |
| SSL automatique | ✅ Oui | ✅ Oui |
| Variables d'environnement | ✅ Oui | ✅ Oui |
| Preview deployments | ✅ Oui | ✅ Oui |
| Edge Functions | ✅ Oui (Workers) | ✅ Oui |
| Gratuit | ✅ Oui | ✅ Oui |

## 🚨 Notes Importantes

1. **DNS** : Si votre DNS est déjà sur Cloudflare, c'est l'option la plus simple
2. **Build** : Le build se fait sur les serveurs de Cloudflare (pas besoin de Node.js local)
3. **Cache** : Cloudflare met en cache automatiquement les assets statiques
4. **HTTPS** : SSL/TLS est automatiquement configuré et renouvelé

## 🔍 Dépannage

### Le site ne se charge pas
- Vérifier que le CNAME est bien configuré dans DNS
- Vérifier que le statut est "Proxied" (nuage orange)
- Attendre quelques minutes pour la propagation DNS

### Les variables d'environnement ne fonctionnent pas
- Vérifier que les variables sont bien définies dans Cloudflare Pages
- Redéployer après avoir ajouté/modifié des variables
- Vérifier que les variables `VITE_*` sont bien préfixées

### Le routing ne fonctionne pas
- Vérifier que `public/_redirects` existe et contient `/*    /index.html   200`
- Vérifier que le fichier est bien dans le dossier `public/`
