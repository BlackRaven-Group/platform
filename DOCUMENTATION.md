# BlackRaven Intelligence Platform - Documentation Complète

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Base de données](#base-de-données)
4. [Fonctionnalités](#fonctionnalités)
5. [Processus et workflows](#processus-et-workflows)
6. [Sécurité](#sécurité)
7. [Déploiement](#déploiement)
8. [Configuration](#configuration)

---

## 🎯 Vue d'ensemble

**BlackRaven** est une plateforme sécurisée d'intelligence et d'investigation OSINT (Open Source Intelligence) conçue pour la collecte, l'analyse et la gestion de données d'investigation.

### Technologies principales

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Déploiement**: Vercel / Netlify
- **APIs externes**: 
  - LeakOSINT API (recherche de data leaks)
  - Google Maps API (géolocalisation)
  - Browserless API (scraping web)
  - Resend API (emails)

---

## 🏗️ Architecture

### Structure du projet

```
├── src/
│   ├── components/          # Composants React
│   │   ├── sections/        # Sections de détails (targets)
│   │   ├── AdminPanel.tsx  # Panneau d'administration
│   │   ├── OSINTDashboard.tsx  # Dashboard OSINT
│   │   ├── DossierList.tsx  # Liste des dossiers
│   │   ├── DossierView.tsx  # Vue détaillée d'un dossier
│   │   ├── GoogleMap.tsx    # Carte Google Maps
│   │   └── ...
│   ├── lib/                 # Services et utilitaires
│   │   ├── supabase.ts     # Client Supabase
│   │   ├── osint.ts        # Service OSINT API
│   │   ├── crypto.ts       # Chiffrement PGP
│   │   ├── mapData.ts      # Gestion des données cartographiques
│   │   └── ...
│   └── App.tsx              # Application principale
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── osint-search/   # Proxy pour API LeakOSINT
│   │   ├── client-auth/    # Authentification clients
│   │   ├── create-admin/   # Création d'admins
│   │   └── ...
│   └── migrations/         # Migrations SQL
└── public/
    └── data/               # Fichiers CSV (pins de carte)
```

### Types d'utilisateurs

1. **Client** : Utilisateurs externes qui font des demandes de services
2. **Admin** : Administrateurs avec différents niveaux d'accès
   - `super_admin` : Accès complet
   - `admin` : Gestion OSINT et dossiers
   - `support` : Gestion des tickets et relations clients
   - `viewer` : Accès en lecture seule

---

## 🗄️ Base de données

### Tables principales

#### 1. **dossiers** - Gestion des cas d'investigation
```sql
- id (uuid, PK)
- title (text)
- description (text)
- code_name (text) - Nom de code généré (ex: RAVEN-456)
- access_code (text) - Code PIN hashé (SHA-256)
- failed_attempts (integer) - Tentatives d'accès échouées
- is_locked (boolean) - Verrouillage après 5 tentatives
- status (text) - open, active, closed, archived
- classification (text) - unclassified, confidential, secret, top_secret
- user_id (uuid) - Propriétaire
- created_by (uuid)
- created_at, updated_at (timestamptz)
```

#### 2. **targets** - Profils de cibles
```sql
- id (uuid, PK)
- dossier_id (uuid, FK → dossiers)
- code_name (text)
- first_name, last_name (text)
- aliases (text[])
- date_of_birth (date)
- gender (text)
- nationality (text)
- profile_image_url (text)
- bio (text)
- status (text) - active, inactive, deceased, unknown
- created_at, updated_at (timestamptz)
```

#### 3. **addresses** - Adresses physiques
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- address_type (text) - current, previous, work, other
- street_address, city, state, postal_code, country (text)
- latitude, longitude (numeric)
- verified (boolean)
- last_seen (timestamptz)
- notes (text)
- created_at (timestamptz)
```

#### 4. **credentials** - Identifiants exposés
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- service (text)
- username, email (text)
- password_encrypted (text) - Mot de passe chiffré
- password_hash (text) - Hash du mot de passe
- breach_source (text) - Source de la fuite
- breach_date (date)
- status (text) - active, changed, unknown
- notes (text)
- created_at (timestamptz)
```

#### 5. **phone_numbers** - Numéros de téléphone
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- phone_number (text)
- number_type (text) - mobile, landline, work, fax, other
- country_code, carrier (text)
- verified (boolean)
- status (text) - active, inactive, unknown
- strength (integer) - 1-10
- last_seen (timestamptz)
- source (text)
- notes (text)
- created_at (timestamptz)
```

#### 6. **network_data** - Données réseau
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- ip_address (inet) - Adresse IP
- ip_type (text) - ipv4, ipv6
- isp (text)
- location (text)
- first_seen, last_seen (timestamptz)
- confidence (text) - low, medium, high
- notes (text)
- created_at (timestamptz)
```

#### 7. **social_media** - Présence sur les réseaux sociaux
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- platform (text)
- username (text)
- profile_url (text)
- follower_count (integer)
- status (text) - active, inactive, suspended, deleted
- last_activity (timestamptz)
- notes (text)
- created_at (timestamptz)
```

#### 8. **intelligence_notes** - Notes d'intelligence
```sql
- id (uuid, PK)
- dossier_id (uuid, FK → dossiers)
- target_id (uuid, FK → targets)
- category (text) - humint, sigint, osint, techint, finint, general
- priority (text) - low, medium, high, critical
- content (text)
- source (text)
- created_by (uuid)
- created_at (timestamptz)
```

#### 9. **connections** - Relations entre cibles
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- connected_target_id (uuid, FK → targets)
- connection_name (text)
- relationship_type (text) - family, friend, colleague, associate, romantic, financial, other
- relationship_details (text)
- strength (integer) - 1-10
- verified (boolean)
- notes (text)
- created_at (timestamptz)
```

#### 10. **employment** - Historique professionnel
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- record_type (text) - employment, education, military, other
- organization (text)
- position (text)
- location (text)
- start_date, end_date (date)
- current (boolean)
- verified (boolean)
- notes (text)
- created_at (timestamptz)
```

#### 11. **media_files** - Fichiers multimédias
```sql
- id (uuid, PK)
- target_id (uuid, FK → targets)
- file_type (text) - image, video, audio, document, other
- file_url (text)
- title, description (text)
- captured_date (timestamptz)
- source (text)
- tags (text[])
- created_at (timestamptz)
```

#### 12. **osint_searches** - Historique des recherches OSINT
```sql
- id (uuid, PK)
- dossier_id (uuid, FK → dossiers)
- query (text)
- limit_used (integer)
- lang (text)
- status (text) - pending, processing, completed, failed, confirmed
- raw_results (jsonb)
- parsed_results (jsonb)
- error_message (text)
- created_at, updated_at (timestamptz)
```

#### 13. **osint_api_config** - Configuration API OSINT
```sql
- id (uuid, PK)
- api_name (text)
- api_key (text)
- bot_name (text)
- is_active (boolean)
- rate_limit (integer)
- created_at, updated_at (timestamptz)
```

#### 14. **client_users** - Comptes clients
```sql
- id (uuid, PK)
- email (text, unique)
- password_hash (text)
- full_name (text)
- organization (text)
- status (text) - pending, active, suspended
- last_login (timestamptz)
- pgp_public_key (text)
- pgp_key_fingerprint (text)
- pgp_key_added_at (timestamptz)
- created_at, updated_at (timestamptz)
```

#### 15. **client_sessions** - Sessions clients
```sql
- id (uuid, PK)
- client_user_id (uuid, FK → client_users)
- token (text, unique)
- expires_at (timestamptz)
- created_at (timestamptz)
```

#### 16. **admin_roles** - Rôles administrateurs
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users, unique)
- role (text) - super_admin, admin, support, viewer
- permissions (jsonb) - Permissions granulaires
- created_by (uuid)
- created_at, updated_at (timestamptz)
```

#### 17. **glpi_tickets** - Tickets de support
```sql
- id (uuid, PK)
- client_user_id (uuid, FK → client_users)
- service_type (text)
- title, description (text)
- glpi_ticket_id (text) - ID dans GLPI
- status (text) - pending, open, in_progress, resolved, closed
- priority (integer) - 1-5
- assigned_to (uuid)
- response (text)
- client_email, client_phone, client_name (text)
- created_at, updated_at (timestamptz)
```

#### 18. **service_requests** - Demandes de services
```sql
- id (uuid, PK)
- client_id (uuid, FK → client_users)
- service_type (text)
- encrypted_message (text) - Message PGP chiffré
- client_public_key (text)
- status (text) - pending, in_progress, completed, cancelled
- created_at, updated_at (timestamptz)
```

#### 19. **service_responses** - Réponses aux demandes
```sql
- id (uuid, PK)
- request_id (uuid, FK → service_requests)
- support_user_id (uuid)
- encrypted_response (text) - Réponse PGP chiffrée
- created_at (timestamptz)
```

#### 20. **map_pins** - Pins sur la carte
```sql
- id (uuid, PK)
- name (text)
- latitude, longitude (numeric)
- category (text)
- description (text)
- metadata (jsonb)
- created_by (uuid)
- created_at, updated_at (timestamptz)
```

#### 21. **map_categories** - Catégories de pins
```sql
- id (uuid, PK)
- name (text, unique)
- color (text)
- icon (text)
- pin_type (text)
- created_at (timestamptz)
```

#### 22. **surveillance_cameras** - Cache des caméras
```sql
- id (uuid, PK)
- external_id (text)
- name (text)
- latitude, longitude (numeric)
- country, city (text)
- type (text)
- stream_url, thumbnail_url (text)
- status (text) - active, inactive, unknown
- last_checked (timestamptz)
- metadata (jsonb)
- created_at (timestamptz)
```

#### 23. **admin_activity_log** - Journal d'activité admin
```sql
- id (uuid, PK)
- admin_id (uuid)
- action (text)
- target_type (text)
- target_id (uuid)
- details (jsonb)
- ip_address (text)
- user_agent (text)
- created_at (timestamptz)
```

#### 24. **glpi_config** - Configuration GLPI
```sql
- id (uuid, PK)
- api_url (text)
- app_token (text)
- user_token (text)
- is_active (boolean)
- created_at, updated_at (timestamptz)
```

#### 25. **site_pgp_config** - Configuration PGP du site
```sql
- id (uuid, PK)
- key_name (text, unique)
- public_key (text)
- encrypted_private_key (text)
- key_fingerprint (text)
- created_at, rotated_at (timestamptz)
- is_active (boolean)
```

### Relations principales

```
dossiers (1) ──→ (N) targets
targets (1) ──→ (N) addresses
targets (1) ──→ (N) credentials
targets (1) ──→ (N) phone_numbers
targets (1) ──→ (N) network_data
targets (1) ──→ (N) social_media
targets (1) ──→ (N) intelligence_notes
targets (1) ──→ (N) connections
targets (1) ──→ (N) employment
targets (1) ──→ (N) media_files
dossiers (1) ──→ (N) osint_searches
dossiers (1) ──→ (N) intelligence_notes
client_users (1) ──→ (N) client_sessions
client_users (1) ──→ (N) glpi_tickets
client_users (1) ──→ (N) service_requests
```

---

## ⚙️ Fonctionnalités

### 1. Gestion des dossiers

#### Création de dossier
- Génération automatique d'un nom de code (ex: `RAVEN-456`)
- Génération d'un code PIN à 6 chiffres
- Hashage du code PIN (SHA-256)
- Classification (unclassified, confidential, secret, top_secret)
- Statut (open, active, closed, archived)

#### Accès sécurisé
- Protection par code PIN à 6 chiffres
- 5 tentatives maximum avant suppression automatique
- Suppression silencieuse après 5 tentatives échouées
- Verrouillage automatique après échec

#### Suppression
- Suppression manuelle depuis la liste (double confirmation)
- Suppression automatique après 5 tentatives échouées
- Suppression en cascade de toutes les données associées

### 2. Recherche OSINT

#### Intégration LeakOSINT API
- Recherche dans les bases de données de fuites
- Extraction automatique de données (emails, téléphones, adresses, credentials)
- Parsing et structuration des résultats
- Historique des recherches

#### Création automatique de cibles
- Extraction de données depuis les résultats OSINT
- Création automatique de dossier si nécessaire
- Génération de code PIN pour le nouveau dossier
- Association des données extraites (credentials, addresses, network_data, etc.)

#### Dashboard OSINT
- Interface de recherche
- Historique des recherches
- Visualisation des résultats
- Sélection et création de cibles

### 3. Gestion des cibles (Targets)

#### Profil de cible
- Informations de base (nom, prénom, aliases)
- Date de naissance, genre, nationalité
- Photo de profil
- Statut (active, inactive, deceased, unknown)

#### Sections de données
- **Addresses** : Adresses physiques avec géolocalisation
- **Phone Numbers** : Numéros de téléphone avec métadonnées
- **Credentials** : Identifiants exposés (chiffrés)
- **Social Media** : Présence sur les réseaux sociaux
- **Network Data** : Adresses IP et données réseau
- **Connections** : Relations avec d'autres cibles
- **Employment** : Historique professionnel/éducation
- **Media Files** : Images, vidéos, documents
- **Intelligence Notes** : Notes d'investigation

### 4. Cartographie

#### Google Maps
- Affichage de pins depuis CSV
- Catégorisation des pins
- Filtrage par catégorie
- Chargement depuis `public/data/*.csv`

#### Surveillance Map
- Affichage des caméras de surveillance
- Cache des caméras dans `surveillance_cameras`
- Statut et métadonnées

### 5. Authentification

#### Clients
- Système d'authentification custom
- Sessions avec tokens
- Support PGP pour communications chiffrées
- Réinitialisation de mot de passe

#### Admins
- Authentification via Supabase Auth
- Rôles et permissions granulaires
- Journal d'activité (audit log)

### 6. Support client

#### Services disponibles
- Recherche personne
- Analyse organisation
- Géolocalisation
- Empreinte numérique
- Analyse réseau
- Demande personnalisée

#### Communication
- **PGP** : Messages chiffrés PGP
- **GLPI** : Système de ticketing intégré

#### Tickets
- Création de tickets depuis l'interface client
- Suivi des tickets
- Réponses chiffrées PGP
- Intégration GLPI

### 7. Administration

#### Panneau admin
- Gestion des utilisateurs
- Gestion des admins et rôles
- Configuration OSINT API
- Configuration GLPI
- Journal d'activité
- Analytics

#### Permissions
- `full_access` : Accès complet
- `manage_dossiers` : Gestion des dossiers
- `manage_tickets` : Gestion des tickets
- `manage_admins` : Gestion des administrateurs

### 8. Export et rapports

#### Export de rapports
- Export HTML formaté
- Export PDF (via Edge Function)
- Données complètes d'un dossier
- Tous les targets et leurs données associées

---

## 🔄 Processus et workflows

### Workflow de création de dossier OSINT

1. **Recherche OSINT**
   - Admin accède au dashboard OSINT
   - Entrée d'une requête (email, nom, etc.)
   - Exécution via Edge Function `osint-search`
   - Proxy vers LeakOSINT API

2. **Traitement des résultats**
   - Parsing des résultats JSON
   - Extraction automatique de données
   - Affichage des cibles extraites

3. **Création de cibles**
   - Sélection des cibles à créer
   - Confirmation
   - Création automatique du dossier (si nécessaire)
   - Génération du code PIN
   - Affichage du code PIN (une seule fois)
   - Création des targets et données associées

4. **Accès au dossier**
   - Saisie du code PIN
   - Vérification (hash SHA-256)
   - Accès au dossier et aux targets

### Workflow de demande client

1. **Authentification client**
   - Connexion via `ClientAuth`
   - Création de session
   - Stockage du token dans localStorage

2. **Sélection de service**
   - Choix du type de service
   - Choix du mode de communication (PGP ou GLPI)

3. **Soumission**
   - **PGP** : Chiffrement du message avec clé publique client
   - **GLPI** : Création de ticket dans GLPI
   - Confirmation et suivi

4. **Réponse**
   - Support répond via interface
   - Chiffrement PGP si applicable
   - Notification client

### Workflow de suppression de dossier

1. **Suppression manuelle**
   - Clic sur bouton de suppression dans la liste
   - Première confirmation (modal)
   - Deuxième confirmation (taper "SUPPRIMER")
   - Suppression en cascade :
     - Intelligence notes
     - Targets et toutes leurs données
     - OSINT searches
     - Dossier lui-même

2. **Suppression automatique**
   - 5 tentatives échouées d'accès
   - Suppression silencieuse immédiate
   - Aucun avertissement

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des politiques spécifiques :

- **Authenticated users** : Accès complet à leurs propres données
- **Admin users** : Accès complet selon leurs permissions
- **Anonymous** : Accès limité (lecture seule pour certaines tables)

### Chiffrement

- **Codes PIN** : Hashés avec SHA-256
- **Mots de passe** : Hashés (bcrypt) pour clients
- **Communications PGP** : Chiffrement end-to-end

### Authentification

- **Clients** : Système custom avec sessions et tokens
- **Admins** : Supabase Auth avec rôles
- **Sessions** : Expiration automatique

### Audit

- Journal d'activité admin (`admin_activity_log`)
- Logs des actions sensibles
- Traçabilité complète

---

## 🚀 Déploiement

### Variables d'environnement requises

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon

# APIs externes
RESEND_API_KEY=votre-clé-resend
SITE_PGP_ENCRYPTED_PRIVATE_KEY=votre-clé-pgp-encryptée
BROWSERLESS_API_KEY=votre-clé-browserless
VITE_GOOGLE_MAPS_API_KEY=votre-clé-google-maps
VITE_LEAKOSINT_API_TOKEN=votre-token-leakosint

# Supabase Edge Functions (secrets)
LEAKOSINT_API_TOKEN=votre-token-leakosint
```

### Déploiement Vercel

1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Build command : `npm run build`
4. Output directory : `dist`

### Migrations Supabase

```bash
# Lier le projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### Edge Functions

```bash
# Déployer une fonction
supabase functions deploy osint-search
```

---

## 📝 Configuration

### Configuration OSINT API

Table `osint_api_config` :
- `api_key` : Token LeakOSINT
- `api_url` : URL de l'API (défaut: https://leakosintapi.com/)
- `default_limit` : Limite par défaut (défaut: 100)
- `default_lang` : Langue par défaut (défaut: 'en')
- `bot_name` : Nom du bot (optionnel)

### Configuration GLPI

Table `glpi_config` :
- `api_url` : URL de l'API GLPI
- `app_token` : Token application GLPI
- `user_token` : Token utilisateur GLPI
- `is_active` : Activer/désactiver l'intégration

### Configuration PGP

Table `site_pgp_config` :
- `public_key` : Clé publique du site
- `encrypted_private_key` : Clé privée chiffrée
- `key_fingerprint` : Empreinte de la clé
- `is_active` : Clé active

---

## 🔧 Maintenance

### Nettoyage des données

- Suppression automatique des dossiers après 5 tentatives échouées
- Suppression manuelle avec double confirmation
- Cascade de suppression pour toutes les données associées

### Sauvegarde

- Migrations Supabase versionnées
- Données stockées dans PostgreSQL (Supabase)
- CSV de pins dans `public/data/`

### Monitoring

- Journal d'activité admin
- Logs Supabase Edge Functions
- Notifications visuelles pour les erreurs

---

## 📚 Ressources

### APIs externes

- **LeakOSINT** : https://leakosintapi.com/
- **Google Maps** : https://developers.google.com/maps
- **Browserless** : https://www.browserless.io/
- **Resend** : https://resend.com/

### Documentation Supabase

- https://supabase.com/docs
- Row Level Security : https://supabase.com/docs/guides/auth/row-level-security
- Edge Functions : https://supabase.com/docs/guides/functions

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-17
