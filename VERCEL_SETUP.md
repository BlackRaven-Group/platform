# 🚀 Déploiement Vercel - BlackRaven

## 📋 Configuration Vercel

### Étape 1 : Connecter le Repository GitHub

1. Aller sur https://vercel.com
2. Cliquer sur **"Sign Up"** ou **"Log In"** (utiliser GitHub pour se connecter)
3. Cliquer sur **"Add New..."** → **"Project"**
4. Cliquer sur **"Import Git Repository"**
5. Rechercher et sélectionner : **`BlackRaven-Group/platform`**
6. Cliquer sur **"Import"**

### Étape 2 : Configuration du Build

Vercel détecte automatiquement Vite, mais vérifiez :

- **Framework Preset** : `Vite` (devrait être détecté automatiquement)
- **Root Directory** : `.` (laisser vide ou mettre `.`)
- **Build Command** : `npm run build` (déjà pré-rempli)
- **Output Directory** : `dist` (déjà pré-rempli)
- **Install Command** : `npm install` (déjà pré-rempli)

### Étape 3 : Variables d'Environnement

Avant de déployer, cliquer sur **"Environment Variables"** et ajouter :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `VITE_SUPABASE_URL` | `https://[votre-projet].supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `[votre-clé-anon]` | Production, Preview, Development |
| `RESEND_API_KEY` | `[votre-clé-resend]` | Production, Preview, Development |
| `SITE_PGP_ENCRYPTED_PRIVATE_KEY` | `[votre-clé-pgp]` | Production, Preview, Development |
| `BROWSERLESS_API_KEY` | `[votre-clé-browserless]` | Production, Preview, Development |
| `VITE_GOOGLE_MAPS_API_KEY` | `[votre-clé-google-maps]` | Production, Preview, Development |

⚠️ **Important** : Cochez les 3 environnements (Production, Preview, Development) pour chaque variable.

### Étape 4 : Déployer

1. Cliquer sur **"Deploy"**
2. Attendre que le build se termine (première fois : ~2-3 minutes)
3. Une fois terminé, vous obtiendrez une URL : `https://blackraven-platform.vercel.app`

### Étape 5 : Configurer le Domaine Personnalisé

1. Dans la page du projet, aller dans **"Settings"** → **"Domains"**
2. Cliquer sur **"Add Domain"**
3. Entrer `blackraven.fr`
4. Vercel vous donnera des instructions DNS à configurer chez votre registrar

**Configuration DNS** (chez votre registrar ou Cloudflare) :

- **Type** : `CNAME` ou `A`
- **Name** : `@` (ou `blackraven.fr`)
- **Value** : `cname.vercel-dns.com` (pour CNAME) ou l'adresse IP fournie par Vercel (pour A)

Si votre DNS est sur Cloudflare :
- Créer un CNAME pointant vers `cname.vercel-dns.com`
- Le statut peut être **DNS only** (gris) ou **Proxied** (orange) - les deux fonctionnent

### Étape 6 : Vérifier le Déploiement

1. Vérifier que le build passe sans erreur
2. Tester l'URL Vercel : `https://blackraven-platform.vercel.app`
3. Tester le domaine personnalisé : `https://blackraven.fr`
4. Vérifier que les variables d'environnement sont bien chargées (console du navigateur)

## 🔧 Configuration des Redirects (SPA)

Vercel utilise le fichier `vercel.json` pour la configuration. Créer ce fichier à la racine du projet :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Ou utiliser le fichier `public/_redirects` existant (Vercel le détecte aussi).

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

Vercel se connecte automatiquement à GitHub et déploie :
- **À chaque push sur `main`** → Déploiement en production
- **À chaque pull request** → Preview deployment (URL temporaire)

## 🆚 Vercel vs Netlify vs Cloudflare Pages

| Fonctionnalité | Vercel | Netlify | Cloudflare Pages |
|----------------|--------|---------|------------------|
| DNS intégré | ❌ Non | ❌ Non | ✅ Oui (si DNS sur CF) |
| CDN global | ✅ Oui | ✅ Oui | ✅ Oui |
| SSL automatique | ✅ Oui | ✅ Oui | ✅ Oui |
| Variables d'environnement | ✅ Oui | ✅ Oui | ✅ Oui |
| Preview deployments | ✅ Oui | ✅ Oui | ✅ Oui |
| Edge Functions | ✅ Oui | ✅ Oui | ✅ Oui |
| Gratuit | ✅ Oui | ✅ Oui | ✅ Oui |
| Interface | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🚨 Notes Importantes

1. **DNS** : Si votre DNS est sur Cloudflare, vous pouvez créer un CNAME pointant vers Vercel
2. **Build** : Le build se fait sur les serveurs de Vercel (pas besoin de Node.js local)
3. **Cache** : Vercel met en cache automatiquement les assets statiques
4. **HTTPS** : SSL/TLS est automatiquement configuré et renouvelé

## 🔍 Dépannage

### Le site ne se charge pas
- Vérifier que le CNAME est bien configuré dans DNS
- Attendre quelques minutes pour la propagation DNS
- Vérifier les logs de build dans Vercel Dashboard

### Les variables d'environnement ne fonctionnent pas
- Vérifier que les variables sont bien définies dans Vercel
- Vérifier que les 3 environnements sont cochés (Production, Preview, Development)
- Redéployer après avoir ajouté/modifié des variables
- Vérifier que les variables `VITE_*` sont bien préfixées

### Le routing ne fonctionne pas
- Créer un fichier `vercel.json` avec la configuration de rewrite (voir ci-dessus)
- Ou vérifier que `public/_redirects` existe et contient `/*    /index.html   200`
