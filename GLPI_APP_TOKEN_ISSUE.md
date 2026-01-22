# ⚠️ Problème App Token GLPI

## 🔍 Situation Actuelle

L'API v1 de GLPI retourne l'erreur :
```
ERROR_WRONG_APP_TOKEN_PARAMETER
```

Même après avoir :
- ✅ Récupéré plusieurs tokens depuis l'interface GLPI
- ✅ Vidé les restrictions IP
- ✅ Utilisé les query parameters (`?user_token=...&app_token=...`)
- ✅ Testé différents formats d'en-têtes

## 🔑 Tokens Testés

1. `467552c0fa0aab9f1dd58f844cedf7f88fed27ec9999cb7e25b7a946c995fe73` (original)
2. `c0b153abe4388afc764f3f92fd94b6a21297f854b15eb475baba1d6606471a66`
3. `bc737d4aa5c6c74fba870da5c259c1eab101510e5d237ffca2c073fc440b610c`
4. `48e3ddebb1a725fe915f61d30f4e31c235d50d746568bb82de17bd5c32e336ad`
5. `6713198ddcd1ce8320533764832868e818d61bfe6c4f2a189cd6cb6872669ad8` (dernier trouvé)

**Aucun ne fonctionne** ❌

## 💡 Solutions Possibles

### Option 1 : Vérifier que le client API est activé
Dans GLPI : Configuration → Générale → Clients de l'API → "full access from localhost"
- Vérifier que "Activé" = "Oui" ✅

### Option 2 : Régénérer l'App Token
Dans GLPI : Configuration → Générale → Clients de l'API → "full access from localhost"
- Cliquer sur "Regénérer" pour créer un nouveau token
- Copier le nouveau token et mettre à jour la base de données

### Option 3 : Vérifier le format de la requête
L'API v1 pourrait nécessiter un format différent. Essayer :
- Headers au lieu de query parameters
- Format différent pour les tokens
- Vérifier la documentation exacte de l'API v1

### Option 4 : Utiliser l'API v2.1 avec OAuth2
Si l'API v1 ne fonctionne pas, il faudra :
- Créer un client OAuth dans GLPI
- Obtenir un access_token JWT via `/api.php/token`
- Utiliser cet access_token pour les requêtes

## 📋 Configuration Actuelle

- **API URL** : `https://desk.blackraven.fr/api.php/v1`
- **User Token** : `4d893d96b9edf615f0967ac8ea26d4cca24979dc7acb2404900d84e15027297f` ✅
- **App Token** : `6713198ddcd1ce8320533764832868e818d61bfe6c4f2a189cd6cb6872669ad8` ❌ (ne fonctionne pas)

## 🔧 Action Recommandée

**Régénérer l'App Token dans GLPI** :
1. Aller à Configuration → Générale → Clients de l'API
2. Cliquer sur "full access from localhost" (ID: 1)
3. Dans la section "Jeton d'application (app_token)", cliquer sur "Regénérer"
4. Copier le nouveau token
5. Mettre à jour la base de données avec le nouveau token
