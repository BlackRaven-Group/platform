# 🚀 Configuration Netlify - Guide Rapide

## 📋 Checklist de Configuration

### 1️⃣ Importer le Repository
- [ ] Aller sur https://app.netlify.com
- [ ] **Add new project** → **Import an existing project**
- [ ] Cliquer sur **GitHub** (autoriser si nécessaire)
- [ ] Sélectionner : **`BlackRaven-Group/platform`**
- [ ] Cliquer sur **Import**

### 2️⃣ Configuration Build
- [ ] **Build command** : `npm run build`
- [ ] **Publish directory** : `dist`
- [ ] **Base directory** : (vide)

### 3️⃣ Variables d'Environnement
Aller dans **Site settings** → **Environment variables** et ajouter :

```
VITE_SUPABASE_URL=https://[votre-projet].supabase.co
VITE_SUPABASE_ANON_KEY=[votre-clé-anon]
RESEND_API_KEY=[votre-clé-resend]
SITE_PGP_ENCRYPTED_PRIVATE_KEY=[votre-clé-pgp]
BROWSERLESS_API_KEY=[votre-clé-browserless]
VITE_GOOGLE_MAPS_API_KEY=[votre-clé-google-maps]
```

### 4️⃣ Domaines Personnalisés
Dans **Site settings** → **Domain management** :

- [ ] Ajouter `blackraven.fr` (domaine principal)
- [ ] Ajouter `op.blackraven.fr` (alias)

### 5️⃣ Configuration DNS (chez votre registrar)

Pour `blackraven.fr` :
```
Type: CNAME
Name: @
Value: [votre-site].netlify.app
```

Pour `op.blackraven.fr` :
```
Type: CNAME
Name: op
Value: [votre-site].netlify.app
```

## ⚙️ Où trouver les valeurs ?

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
3. Tester `op.blackraven.fr` → doit afficher "Master Poulet"
4. Vérifier que les variables d'environnement sont bien chargées

## 🔧 Fichiers de configuration déjà présents

- ✅ `netlify.toml` - Configuration build et redirects
- ✅ `public/_redirects` - Redirects SPA
- ✅ Tout est prêt, il suffit de configurer Netlify !
