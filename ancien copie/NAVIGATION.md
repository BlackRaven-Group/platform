# SYSTÈME DE NAVIGATION - BLACKRAVEN

## Structure des Dashboards

### 1. OSINT DASHBOARD (Dashboard Principal)
- **URL/View**: `currentView = 'list'`
- **Description**: Dashboard principal avec les dossiers, surveillance, map, OSINT
- **Header**: "OSINT INTELLIGENCE PLATFORM"
- **Accès**: Tous les administrateurs authentifiés

**Fonctionnalités:**
- Gestion des dossiers
- Surveillance
- Map
- OSINT Search
- Bouton "ADMIN PANEL" (visible uniquement pour super_admin et admin)

### 2. ADMIN PANEL (Panneau d'Administration)
- **URL/View**: `currentView = 'adminPanel'`
- **Description**: Interface de gestion système
- **Header**: "ADMIN MANAGEMENT PANEL"
- **Accès**: super_admin et admin uniquement

**Fonctionnalités:**
- Gestion des utilisateurs clients
- Gestion des rôles administrateurs
- Journal d'activité
- Bouton "OSINT DASHBOARD" pour revenir au dashboard principal

## Navigation Entre les Dashboards

### Du OSINT Dashboard → Admin Panel
1. L'utilisateur doit être authentifié avec `userType = 'admin'`
2. L'utilisateur doit avoir le rôle `super_admin` ou `admin`
3. Un bouton **"ADMIN PANEL"** (orange/amber) apparaît dans le header
4. Cliquer sur ce bouton change `currentView` à `'adminPanel'`

### De l'Admin Panel → OSINT Dashboard
1. Un bouton **"OSINT DASHBOARD"** (vert/green) apparaît dans le header
2. Cliquer sur ce bouton change `currentView` à `'list'`
3. Les dossiers sont rechargés automatiquement

## Rôles et Permissions

### Rôles Admin:
- **super_admin**: Accès complet (OSINT Dashboard + Admin Panel)
- **admin**: Accès complet (OSINT Dashboard + Admin Panel)
- **support**: Accès uniquement au Support Dashboard (pas de navigation)
- **viewer**: Accès uniquement au OSINT Dashboard (pas d'Admin Panel)
- **client**: Accès uniquement au OSINT Dashboard (pas d'Admin Panel)

## Indicateurs Visuels

### Dans le Header OSINT:
- Badge de rôle: `ROLE: SUPER_ADMIN` ou `ROLE: ADMIN` (visible pour les admins)
- Bouton "ADMIN PANEL" (border amber-600, text amber-500)
- Bouton "LOGOUT" (standard)

### Dans le Header Admin Panel:
- Titre: "ADMIN MANAGEMENT PANEL"
- Bouton "OSINT DASHBOARD" (border green-600, text green-500)
- Bouton "LOGOUT" (standard)

## Vérification de l'Affichage

Pour vérifier que les boutons s'affichent correctement:

1. **Vérifier le rôle dans la console**:
   - Ouvrir la console du navigateur (F12)
   - Le badge du rôle devrait être visible dans le header
   - Exemple: `ROLE: SUPER_ADMIN` ou `ROLE: ADMIN`

2. **Vérifier les conditions**:
   - `userType` doit être `'admin'`
   - `userRole` doit être `'super_admin'` ou `'admin'`

3. **Si les boutons ne s'affichent pas**:
   - Vérifier la base de données: table `admin_roles`
   - Vérifier que l'utilisateur a bien un enregistrement avec le bon rôle
   - Se déconnecter et se reconnecter pour rafraîchir la session

## Débogage

### Étapes de débogage:
1. Se connecter en tant qu'admin
2. Vérifier le badge de rôle dans le header
3. Si le badge n'apparaît pas, vérifier `admin_roles` dans Supabase
4. Si le badge apparaît mais pas le bouton, vérifier la console pour les erreurs
5. Vider le cache du navigateur et recharger la page
