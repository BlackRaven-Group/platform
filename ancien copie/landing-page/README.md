# BlackRaven Valhalla - Site Vitrine

Site vitrine standalone pour BlackRaven Valhalla OSINT Intelligence.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build Production

```bash
npm run build
```

Les fichiers buildés seront dans le dossier `dist/`.

## Configuration

Modifiez les URLs dans `src/App.tsx` :
- `handleAccessServices()` : URL de l'application principale
- `handleAdminAccess()` : URL de l'accès admin

## Déploiement

Ce site est indépendant et ne nécessite pas de base de données.
Vous pouvez le déployer sur :
- Netlify
- Vercel
- GitHub Pages
- Tout hébergeur statique
