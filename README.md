# Mcdopay

Work-hours and salary tracker with a cutoff budget planner. React + TypeScript + Vite.
All data is stored in the browser (localStorage). Use Settings → Backup and restore to keep a copy.

## Run locally

```bash
npm install
npm run dev
```

## Publish on GitHub Pages

```bash
npm run build
```

Pushing to `main` deploys automatically through `.github/workflows/deploy.yml` (Settings → Pages → Source: GitHub Actions).
To publish by hand instead, upload the **contents** of the `dist` folder (not the folder itself) to the branch GitHub Pages serves.
The app uses relative paths and a hash router, so it works from `https://<user>.github.io/<repo>/`
without any extra setup. GitHub Pages is https, which installing and offline use require.

## Install and offline

- The build writes `dist/sw.js`, which saves every app file on the device after the first visit.
- Android and desktop Chrome/Edge show an **Install app** button. iPhone has no such button, so the app
  shows steps for Share → Add to Home Screen.
- After you publish a new version, open the app once with internet and close it fully. The next launch uses the update.
- An iPhone Home Screen app keeps its own storage, so it starts empty. Download a backup from Safari first,
  then restore it inside the installed app.
