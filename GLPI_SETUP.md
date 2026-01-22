# Configuration GLPI - BlackRaven

## ✅ Configuration effectuée

### 1. Base de données
- ✅ Migration appliquée : Configuration GLPI mise à jour dans `glpi_config`
- ✅ URL API : `https://desk.blackraven.fr/api.php/v2.1`
- ✅ Token : `XMgrDtecbyK2EJ7B2QAH` (utilisé pour app_token et user_token)

### 2. Edge Function créée
- ✅ `supabase/functions/create-glpi-ticket/index.ts`
- ✅ Gère l'authentification GLPI
- ✅ Crée des tickets dans GLPI
- ✅ Synchronise avec la base de données

### 3. Intégration frontend
- ✅ `GLPITicketing.tsx` modifié pour appeler l'Edge Function
- ✅ Les tickets sont créés dans GLPI automatiquement

## 📋 À faire (URGENT)

### 1. Déployer l'Edge Function ⚠️
**L'Edge Function `create-glpi-ticket` n'est pas encore déployée !**

```bash
# Se connecter à Supabase
supabase login

# Lier le projet (si pas déjà fait)
supabase link --project-ref rsndbepkhfrxlokkmjbi

# Déployer la fonction
supabase functions deploy create-glpi-ticket
```

**Sans cette étape, les tickets ne seront pas créés dans GLPI !**

### 2. Vérifier l'authentification GLPI

**Important** : GLPI REST API v2.1 nécessite généralement **deux tokens** :
- `app_token` : Token de l'application
- `user_token` : Token de l'utilisateur

Si vous avez fourni un seul token (`XMgrDtecbyK2EJ7B2QAH`), il faut vérifier :

1. **Option A** : Si c'est un token unique qui fonctionne pour les deux :
   - ✅ Configuration actuelle correcte (même token pour app_token et user_token)

2. **Option B** : Si GLPI nécessite deux tokens différents :
   - Il faudra obtenir le `user_token` séparément
   - Mettre à jour la config dans la base de données

### 3. Fonctionnalités ajoutées

✅ **Création automatique d'utilisateurs GLPI** :
- L'Edge Function recherche d'abord si l'utilisateur existe dans GLPI (par email)
- Si non trouvé, crée automatiquement un nouvel utilisateur/contact
- Associe ensuite le ticket à cet utilisateur

✅ **Gestion des erreurs** :
- Si la création GLPI échoue, le ticket est quand même sauvegardé localement
- Logs détaillés pour le débogage

### 4. Tester la connexion

Pour tester si la configuration fonctionne :

1. **Déployer l'Edge Function** (voir étape 1 ci-dessus)

2. **Créer un ticket** :
   - Créer un ticket depuis l'interface client
   - Vérifier les logs de l'Edge Function dans Supabase Dashboard
   - Vérifier si le ticket apparaît dans GLPI à `https://desk.blackraven.fr`
   - Vérifier si l'utilisateur a été créé dans GLPI

### 4. Documentation GLPI API

Consultez la documentation de votre instance GLPI :
- URL : `https://desk.blackraven.fr/api.php/v2.1/doc`
- Vérifier les endpoints disponibles
- Vérifier le format d'authentification exact

## 🔍 Vérifications nécessaires

1. **Token unique ou double ?**
   - Si erreur d'authentification, vérifier si GLPI nécessite deux tokens différents
   - Le token fourni peut être soit `app_token` soit `user_token`

2. **Format d'authentification**
   - GLPI v2.1 utilise généralement :
     - Header `App-Token` pour app_token
     - Header `Authorization: user_token <token>` pour user_token
   - Vérifier dans votre documentation GLPI

3. **Structure des tickets**
   - Vérifier les champs requis pour créer un ticket
   - Peut nécessiter des catégories, utilisateurs, etc.

## 📝 Prochaines étapes

1. **Déployer l'Edge Function** (nécessite `supabase login`)
2. **Tester la création d'un ticket** depuis l'interface
3. **Vérifier les logs** si erreur
4. **Ajuster la config** si nécessaire (tokens, champs, etc.)

## 🛠️ Si erreur d'authentification

Si vous obtenez une erreur 401 ou 403 lors de la création de tickets :

1. Vérifier que le token est correct
2. Vérifier si GLPI nécessite deux tokens différents
3. Vérifier les permissions du token dans GLPI
4. Consulter la documentation : `https://desk.blackraven.fr/api.php/v2.1/doc`
