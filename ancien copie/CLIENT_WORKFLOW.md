# BlackRaven Valhalla - Workflow Client

## Vue d'ensemble

Le système BlackRaven Valhalla est divisé en deux applications distinctes :
1. **Site vitrine** - Page d'accueil publique
2. **Application OSINT** - Plateforme sécurisée avec authentification

## Parcours Client

### 1. Découverte (Site Vitrine)

Le client arrive sur le **site vitrine** hébergé sur un domaine principal (ex: `blackraven.com`).

**Contenu visible :**
- Présentation des services OSINT
- Descriptions des prestations
- Présentation de l'équipe
- Informations sur la sécurité

**Actions possibles :**
- Cliquer sur "ACCÈS SERVICES"
- Cliquer sur "DEMANDER UNE PRESTATION"
- Cliquer sur "[ADMIN]" (réservé aux administrateurs)

### 2. Redirection vers l'Application

Quand le client clique sur un bouton d'action, il est redirigé vers l'**application principale** hébergée sur un sous-domaine (ex: `app.blackraven.com`).

### 3. Authentification Client

#### Première Visite - Inscription

L'application affiche l'écran d'authentification avec deux onglets :
- **CONNEXION**
- **INSCRIPTION** ← Le client doit s'inscrire

**Formulaire d'inscription :**
```
┌────────────────────────────────────┐
│ Nom complet: *                     │
│ [John Doe]                         │
│                                    │
│ Organisation:                      │
│ [Ma Société]                       │
│                                    │
│ Email: *                           │
│ [john@example.com]                 │
│                                    │
│ Mot de passe: * (min 8 caractères)│
│ [••••••••]                         │
│                                    │
│ [CRÉER UN COMPTE]                  │
└────────────────────────────────────┘
```

**Après soumission :**
- Le compte est créé avec le statut **"pending"**
- Message affiché : *"Votre compte a été créé avec succès. Il est en attente d'approbation par un administrateur."*
- Le client ne peut pas encore accéder aux services

#### Approbation Admin (Côté Admin)

Un administrateur doit approuver le compte :
1. L'admin se connecte au système
2. Accède à la liste des comptes en attente
3. Change le statut de "pending" à "active"

**SQL pour approbation manuelle :**
```sql
UPDATE client_users
SET status = 'active'
WHERE email = 'john@example.com';
```

#### Connexion Client

Une fois approuvé, le client peut se connecter :

**Formulaire de connexion :**
```
┌────────────────────────────────────┐
│ Email: *                           │
│ [john@example.com]                 │
│                                    │
│ Mot de passe: *                    │
│ [••••••••]                         │
│                                    │
│ [SE CONNECTER]                     │
└────────────────────────────────────┘
```

**Cas d'erreur :**
- Compte "pending" : *"Votre compte est en attente d'approbation"*
- Compte "suspended" : *"Votre compte a été suspendu"*
- Mauvais identifiants : *"Email ou mot de passe incorrect"*

### 4. Sélection de Service

Après connexion réussie, le client accède à la **page de sélection de services** :

```
┌─────────────────────────────────────────┐
│     SÉLECTION DE SERVICE                │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [ICON] OSINT SEARCH             │   │
│  │ Recherche open-source           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [ICON] SURVEILLANCE             │   │
│  │ Surveillance géospatiale        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [ICON] DATA ANALYSIS            │   │
│  │ Analyse de données              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 5. Choix du Moyen de Communication

Après avoir sélectionné un service, le client choisit son moyen de communication :

```
┌─────────────────────────────────────────┐
│   CHOISIR UN MOYEN DE COMMUNICATION     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [ICON] PGP MESSAGING            │   │
│  │ Communications chiffrées         │   │
│  │ Sécurité maximale               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [ICON] GLPI TICKETING           │   │
│  │ Système de tickets              │   │
│  │ Suivi structuré                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 6. Soumission de Demande

#### Option A: PGP Messaging (Sécurisé)

Le client peut :
- Voir la clé publique PGP de BlackRaven
- Coller son message chiffré
- Envoyer la demande de manière anonyme et sécurisée

**Avantages :**
- Chiffrement end-to-end
- Anonymat total
- Sécurité militaire

#### Option B: GLPI Ticketing (Structuré)

Le client remplit un formulaire de ticket :
- Titre de la demande
- Description détaillée
- Priorité
- Type de prestation
- Fichiers joints (optionnel)

**Avantages :**
- Suivi en temps réel
- Historique des échanges
- Notifications automatiques
- Interface structurée

### 7. Déconnexion

Le client peut se déconnecter à tout moment :
- Clic sur le bouton "LOGOUT"
- La session est supprimée
- Retour à l'écran de connexion

---

## Sécurité

### Sessions Client

- **Durée :** 7 jours
- **Stockage :** Token unique dans `client_sessions`
- **Expiration :** Automatique après 7 jours
- **Révocation :** À la déconnexion

### Mots de passe

- **Hash :** SHA-256 (côté client) puis stocké
- **Minimum :** 8 caractères
- **Pas de stockage en clair**

### RLS (Row Level Security)

- Les clients ne voient que leurs propres données
- Isolation totale entre clients
- Policies Supabase strictes

---

## Statuts de Compte

| Statut | Description | Actions Possibles |
|--------|-------------|-------------------|
| **pending** | En attente d'approbation | Aucune - Attendre validation admin |
| **active** | Compte approuvé | Accès complet aux services |
| **suspended** | Compte suspendu | Aucune - Contacter support |

---

## FAQ Client

### Q: Combien de temps pour l'approbation ?
R: En général 24-48h. Vous recevrez un email de notification.

### Q: Puis-je changer mon mot de passe ?
R: Oui, dans les paramètres de votre profil (à implémenter).

### Q: Mes données sont-elles sécurisées ?
R: Oui, chiffrement de bout en bout avec PGP, RLS sur la base de données, et architecture zero-knowledge.

### Q: Puis-je soumettre plusieurs demandes ?
R: Oui, sans limite. Chaque demande est trackée séparément.

### Q: Comment suivre mes demandes ?
R: Via le système GLPI ou par communication PGP directe.

---

## Support Client

Pour toute question :
- **Email :** support@blackraven.com
- **PGP :** Disponible sur la plateforme
- **GLPI :** Ticket de support direct
