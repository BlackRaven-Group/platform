# 🔑 Tokens GLPI Récupérés

## ✅ Tokens trouvés dans l'interface GLPI

### App Token (Client API)
- **Token** : `467552c0fa0aab9f1dd58f844cedf7f88fed27ec9999cb7e25b7a946c995fe73`
- **Source** : Page "Clients de l'API" → Client "full access from localhost" (ID: 1)
- **Format** : Hash hexadécimal (64 caractères)
- **Statut** : ✅ Récupéré et mis à jour dans la base de données

### User Token (Jeton d'API utilisateur)
- **Token** : `4d893d96b9edf615f0967ac8ea26d4cca24979dc7acb2404900d84e15027297f`
- **Source** : Page "Préférences" → Onglet "Sécurité" → Section "Jeton d'API"
- **Format** : Hash hexadécimal (64 caractères)
- **Statut** : ✅ Récupéré et mis à jour dans la base de données

## ⚠️ Problème identifié

**GLPI REST API v2.1 exige des tokens au format JWT** (format `xxx.yyy.zzz` avec deux points), mais les tokens récupérés sont des **hash hexadécimaux simples**, pas des JWT.

### Erreur rencontrée
```
{"status":"ERROR_INVALID_PARAMETER","title":"Invalid OAuth token","detail":"The JWT string must have two dots"}
```

## 🔍 Configuration actuelle dans la base de données

```sql
SELECT * FROM glpi_config WHERE is_active = true;
```

Résultat :
- **api_url** : `https://desk.blackraven.fr/api.php/v2.1`
- **app_token** : `467552c0fa0aab9f1dd58f844cedf7f88fed27ec9999cb7e25b7a946c995fe73`
- **user_token** : `4d893d96b9edf615f0967ac8ea26d4cca24979dc7acb2404900d84e15027297f`
- **is_active** : `true`

## 🔧 Solutions possibles

### Option 1 : Utiliser l'API GLPI v1 (si disponible)
L'API v1 pourrait accepter les tokens au format hash simple au lieu de JWT.

**Test** :
```bash
curl -X GET "https://desk.blackraven.fr/api.php/v1/initSession" \
  -H "Authorization: user_token 4d893d96b9edf615f0967ac8ea26d4cca24979dc7acb2404900d84e15027297f" \
  -H "App-Token: 467552c0fa0aab9f1dd58f844cedf7f88fed27ec9999cb7e25b7a946c995fe73"
```

### Option 2 : Générer des tokens JWT depuis GLPI
Il se peut que GLPI v2.1 nécessite de générer les tokens différemment, peut-être via :
- Configuration → Général → API → Générer un nouveau token JWT
- Ou via une commande CLI GLPI

### Option 3 : Utiliser l'authentification par username/password
Si GLPI supporte l'authentification directe par username/password dans l'API, cela pourrait contourner le problème des tokens.

### Option 4 : Vérifier la version GLPI
La version actuelle est **GLPI 11.0.4**. Il se peut que cette version nécessite une configuration spécifique pour les tokens JWT.

## 📝 Prochaines étapes

1. ✅ Tokens récupérés depuis l'interface GLPI
2. ✅ Configuration mise à jour dans la base de données
3. ❌ **Authentification échoue** - Les tokens ne sont pas au format JWT
4. ⏳ **Action requise** : Trouver comment générer des tokens JWT valides pour GLPI v2.1

## 🔗 Références

- **Documentation API GLPI** : `https://desk.blackraven.fr/api.php/v2.1/doc`
- **Swagger JSON** : `https://desk.blackraven.fr/api.php/v2.1.0/doc.json`
- **Version GLPI** : 11.0.4

## 📋 Identifiants de connexion GLPI

- **URL** : `https://desk.blackraven.fr/`
- **Username** : `blackraven`
- **Password** : `O58QgpP270Ijol6PQgXk`
