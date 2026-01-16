# Diagnostic Blackraven

## Si vous ne voyez rien s'afficher

### 1. Vérifiez la console du navigateur
Ouvrez les outils de développement (F12) et regardez la console. Recherchez des erreurs.

### 2. Videz le cache et rechargez
- Chrome/Edge: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)

### 3. Vérifiez l'état de l'authentification
Si vous êtes bloqué sur un écran vide :
1. Ouvrez la console du navigateur (F12)
2. Tapez : `localStorage.clear()` puis Entrée
3. Tapez : `sessionStorage.clear()` puis Entrée
4. Rechargez la page (F5)

### 4. Testez l'écran de connexion
Après avoir vidé le cache, vous devriez voir l'écran de connexion. Si ce n'est pas le cas :
- Vérifiez que le serveur de développement est lancé
- Vérifiez qu'aucune erreur n'apparaît dans la console

### 5. Flux de connexion par rôle

#### Client (`client@blackraven.ops` / `BlackRaven2025!Client`)
Après connexion → Page d'accueil Blackraven (fond gris/slate avec hero section)

#### Support (`support@blackraven.ops` / `BlackRaven2025!Support`)
Après connexion → Dashboard support (fond sombre avec liste de demandes à gauche)

#### Équipes Opérationnelles (Alpha, Sigma, Omega, Delta)
Après connexion → Interface OSINT classique (fond noir/vert)

### 6. Si vous voyez "Chargement..." en permanence
Le chargement du profil utilisateur prend trop de temps. Vérifiez :
1. Que la base de données Supabase est accessible
2. Qu'il n'y a pas d'erreurs dans la console
3. Que les variables d'environnement dans `.env` sont correctes

### 7. Test rapide sans authentification
Pour tester si les composants se chargent, vous pouvez temporairement forcer l'affichage de la landing page :

Dans `src/App.tsx`, après la ligne 166 (`if (!authenticated) {`), ajoutez :
```typescript
// TEST: Afficher la landing page sans authentification
return <LandingPage onAccessServices={() => console.log('Services clicked')} />;
```

Cela vous permettra de voir si le problème vient de l'authentification ou du composant lui-même.

### 8. Vérifiez les variables d'environnement
Le fichier `.env` doit contenir :
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

Sans ces variables, l'application ne peut pas fonctionner.

## Commandes utiles

### Redémarrer le serveur de développement
```bash
npm run dev
```

### Rebuild le projet
```bash
npm run build
```

### Vérifier les erreurs TypeScript
```bash
npm run typecheck
```

## Comptes de test

| Email | Mot de passe | Vue attendue |
|-------|--------------|--------------|
| client@blackraven.ops | BlackRaven2025!Client | Landing Page Blackraven |
| support@blackraven.ops | BlackRaven2025!Support | Dashboard Support |
| admin@blackraven.ops | BlackRaven2025!Admin | Dashboard Support |
| alpha@blackraven.ops | BlackRaven2025!Alpha | Interface OSINT |

## Structure actuelle

```
App.tsx
├── AuthScreen (si non authentifié)
└── Authentifié
    ├── LandingPage (vue par défaut pour clients)
    ├── ServiceSelection (choix de prestation)
    ├── PGPMessaging (messagerie chiffrée)
    ├── SupportDashboard (pour support/admin)
    └── Interface OSINT (pour équipes opérationnelles)
```

## Contact

Si le problème persiste après avoir essayé toutes ces étapes, partagez :
1. Le contenu de la console du navigateur (F12 → Console)
2. Le rôle avec lequel vous essayez de vous connecter
3. Ce que vous voyez à l'écran (écran blanc, message d'erreur, etc.)
