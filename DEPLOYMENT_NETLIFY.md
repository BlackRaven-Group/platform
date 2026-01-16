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

## Déploiement sur Netlify

### Option 1 : Un seul site avec deux domaines

1. **Créer un nouveau site sur Netlify**
   - Connecter le repository GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Configurer les domaines**
   - Aller dans "Domain settings"
   - Ajouter `blackraven.fr` comme domaine principal
   - Ajouter `op.blackraven.fr` comme alias

3. **Configurer les variables d'environnement**
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
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

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase (anon key) |

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
