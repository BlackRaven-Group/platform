# 🚨 FIX LOGIN - INSTRUCTIONS RAPIDES

## PROBLEME
Vous ne pouvez pas vous connecter car les utilisateurs admin ont été créés incorrectement.

## SOLUTION EN 3 ETAPES

### Étape 1: Ouvrir le fichier setup
Ouvrez `setup-admin.html` dans votre navigateur

### Étape 2: Cliquer sur le bouton
Cliquez sur "🚀 SETUP ADMIN USERS"

### Étape 3: Se connecter
Utilisez ces credentials:

```
Username: super_admin
Password: SuperAdmin2025!
```

---

## CREDENTIALS COMPLETS

Après le setup, vous aurez 3 comptes:

**SUPER ADMIN** (Accès total)
- Username: `super_admin`
- Password: `SuperAdmin2025!`
- Email: `super_admin@k3pr0s.local`

**ADMIN** (OSINT & Dossiers)
- Username: `admin`
- Password: `Admin2025!`
- Email: `admin@k3pr0s.local`

**SUPPORT** (Tickets & Clients)
- Username: `support`
- Password: `Support2025!`
- Email: `support@k3pr0s.local`

---

## SI ÇA NE MARCHE PAS

### Option A: Via Node.js
```bash
node test-setup.js
```

### Option B: Via curl
```bash
curl -X POST https://sswoxkjkkxtkxppslabx.supabase.co/functions/v1/setup-admin-users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd294a2pra3h0a3hwcHNsYWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzEzNzgsImV4cCI6MjA4NDA0NzM3OH0.oVrswGc-ahuIT5mQOBb0pxXwXkGgYjzXwCLbiGWhNlc" \
  -H "Content-Type: application/json"
```

---

## VERIFICATION

Pour vérifier que les utilisateurs sont créés:

```sql
SELECT email, id FROM auth.users WHERE email LIKE '%@k3pr0s.local';
```

Vous devriez voir 3 utilisateurs.

---

## AIDE SUPPLEMENTAIRE

- Documentation complète: `AUTHENTICATION_FIX.md`
- Analyse détaillée: Voir l'audit complet fourni précédemment
