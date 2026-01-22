# Problème d'authentification GLPI

## ✅ Ce qui a été fait

1. **Edge Function `create-glpi-ticket` déployée** ✅
   - Crée automatiquement les utilisateurs/contacts dans GLPI
   - Crée les tickets avec l'utilisateur associé
   - Synchronise avec la base de données

2. **Edge Function `sync-glpi-ticket` déployée** ✅
   - Permet de synchroniser manuellement les tickets existants
   - Extrait les infos de contact depuis la description ou les colonnes `client_*`

3. **Configuration GLPI mise à jour** ✅
   - URL: `https://desk.blackraven.fr/api.php/v2.1`
   - app_token: `ZUaFDFR4qjuDjVNJgInjFYJ3QZcAqFC2XvYBbEMN`
   - user_token: `XMgrDtecbyK2EJ7B2QAH`

4. **Ticket test préparé** ✅
   - ID: `b59ef9ea-2e39-40b3-b2c1-80c375846ded`
   - Infos de contact extraites et sauvegardées

## ❌ Problème actuel

**Erreur d'authentification GLPI** :
```
"Invalid OAuth token - The JWT string must have two dots"
```

GLPI attend un token au format JWT (`xxx.yyy.zzz`), mais les tokens fournis ne sont pas au format JWT.

## 🔍 Solutions possibles

### Option 1: Vérifier le format d'authentification GLPI v2.1

GLPI v2.1 peut utiliser différents formats d'authentification :
- JWT tokens (format `xxx.yyy.zzz`)
- Basic Auth
- API tokens simples

**Action requise** : Vérifier dans la documentation GLPI (`https://desk.blackraven.fr/api.php/v2.1/doc`) :
- Le format exact des tokens attendus
- Si les tokens doivent être générés depuis l'interface GLPI
- Si un JWT doit être créé à partir des tokens fournis

### Option 2: Générer les tokens depuis GLPI

Les tokens doivent peut-être être générés depuis l'interface GLPI :
1. Se connecter à GLPI (`https://desk.blackraven.fr`)
2. Aller dans **Configuration** → **API**
3. Générer un **App Token** et un **User Token**
4. Les tokens générés seront au format JWT

### Option 3: Utiliser Basic Auth

Si GLPI supporte Basic Auth, modifier l'Edge Function pour utiliser :
```typescript
headers: {
  'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
  'App-Token': app_token,
}
```

## 📝 Prochaines étapes

1. **Vérifier la documentation GLPI** : `https://desk.blackraven.fr/api.php/v2.1/doc`
2. **Générer les tokens depuis l'interface GLPI** si nécessaire
3. **Tester avec les nouveaux tokens** une fois le format correct identifié

## 🧪 Test de synchronisation

Une fois l'authentification corrigée, tester avec :
```bash
curl -X POST "https://rsndbepkhfrxlokkmjbi.supabase.co/functions/v1/sync-glpi-ticket" \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"b59ef9ea-2e39-40b3-b2c1-80c375846ded"}'
```

## 📋 État actuel

- ✅ Edge Functions déployées
- ✅ Configuration sauvegardée
- ✅ Ticket test préparé
- ❌ Authentification GLPI à corriger (format token)

Une fois l'authentification corrigée, la synchronisation devrait fonctionner automatiquement.
