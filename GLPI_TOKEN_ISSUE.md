# ⚠️ Problème d'authentification GLPI - Format Token

## 🔴 Problème identifié

GLPI REST API v2.1 **exige un token au format JWT** (format `xxx.yyy.zzz` avec deux points), mais les tokens fournis ne sont **pas au format JWT**.

### Erreur rencontrée
```
"Invalid OAuth token - The JWT string must have two dots"
```

### Tokens actuels (non-JWT)
- **User Token** : `ZUaFDFR4qjuDjVNJgInjFYJ3QZcAqFC2XvYBbEMN`
- **App Token** : `9wLC5CsDcUjXoOweF7Xyb8YFAC042aaf0xDwv70h`

## ✅ Ce qui a été fait

1. ✅ **Edge Functions déployées** :
   - `create-glpi-ticket` : Crée automatiquement les tickets dans GLPI
   - `sync-glpi-ticket` : Synchronise les tickets existants

2. ✅ **Configuration mise à jour** dans la base de données

3. ✅ **Code amélioré** :
   - Création automatique d'utilisateurs/contacts dans GLPI
   - Gestion des erreurs améliorée
   - Tentative avec headers puis query params

4. ✅ **Ticket test préparé** :
   - ID: `b59ef9ea-2e39-40b3-b2c1-80c375846ded`
   - Infos de contact extraites

## 🔧 Solution requise

### Option 1 : Générer les tokens JWT depuis GLPI (RECOMMANDÉ)

1. **Se connecter à GLPI** : `https://desk.blackraven.fr`
2. **Aller dans** : Configuration → Général → API
3. **Vérifier** :
   - API Rest activée : **Oui**
   - Documentation API en ligne : **Oui**
4. **Générer les tokens** :
   - **App Token** : Configuration → Général → API → Créer un App Token
   - **User Token** : Profil utilisateur → Sécurité → Générer un User Token
5. **Format attendu** : Les tokens générés doivent être au format JWT (`xxx.yyy.zzz`)

### Option 2 : Vérifier la version GLPI

Si votre GLPI est en version **v2.1.0** ou supérieure, les tokens doivent être au format JWT.

**Vérifier la version** :
```bash
curl -X GET "https://desk.blackraven.fr/api.php/v2.1.0/doc.json" | grep -i version
```

### Option 3 : Utiliser une version antérieure de l'API

Si GLPI supporte une version antérieure de l'API qui utilise des tokens simples :
- Essayer avec `/api.php/v1/` au lieu de `/api.php/v2.1/`

## 📝 Test de synchronisation

Une fois les tokens JWT corrects obtenus :

1. **Mettre à jour la config** :
```sql
UPDATE glpi_config
SET 
  app_token = '<JWT_APP_TOKEN>',
  user_token = '<JWT_USER_TOKEN>',
  updated_at = now()
WHERE is_active = true;
```

2. **Tester la synchronisation** :
```bash
curl -X POST "https://rsndbepkhfrxlokkmjbi.supabase.co/functions/v1/sync-glpi-ticket" \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"b59ef9ea-2e39-40b3-b2c1-80c375846ded"}'
```

3. **Vérifier dans GLPI** : Le ticket devrait apparaître dans `https://desk.blackraven.fr`

## 🔍 Documentation GLPI

- **Documentation API** : `https://desk.blackraven.fr/api.php/v2.1/doc`
- **Swagger JSON** : `https://desk.blackraven.fr/api.php/v2.1.0/doc.json`

## 📋 État actuel

- ✅ Edge Functions : Déployées et prêtes
- ✅ Configuration : Sauvegardée (tokens non-JWT)
- ✅ Ticket test : Prêt pour synchronisation
- ❌ **Authentification** : En attente de tokens JWT valides

**Action requise** : Obtenir les tokens JWT depuis l'interface GLPI et mettre à jour la configuration.
