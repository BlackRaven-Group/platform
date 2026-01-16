# BlackRaven Intelligence Platform

> Plateforme sécurisée d'intelligence et d'investigation OSINT.

## 🚀 Déploiement

Voir [DEPLOYMENT_NETLIFY.md](./DEPLOYMENT_NETLIFY.md) pour les instructions de déploiement.

## 🛠️ Technologies

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Déploiement**: Netlify

## 📦 Installation locale

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

## 🔐 Variables d'environnement

Créez un fichier `.env` à la racine (copiez depuis `.env.example`) :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique

# Email (Resend)
RESEND_API_KEY=votre-clé-resend

# PGP
SITE_PGP_ENCRYPTED_PRIVATE_KEY=votre-clé-pgp-encryptée

# Browserless (scraping)
BROWSERLESS_API_KEY=votre-clé-browserless

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=votre-clé-google-maps
```

## 📁 Structure du projet

```
├── src/
│   ├── components/     # Composants React
│   ├── lib/            # Utilitaires et services
│   ├── App.tsx         # Application principale
│   └── main.tsx        # Point d'entrée
├── public/             # Assets statiques
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Migrations SQL
└── netlify.toml        # Configuration Netlify
```

## 🔒 Sécurité

- Authentification client custom avec sessions
- Authentification admin via Supabase Auth
- Row Level Security (RLS) sur toutes les tables
- Communications PGP chiffrées

## 📄 License

Propriétaire - Tous droits réservés.
