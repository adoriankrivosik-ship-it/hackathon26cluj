# Hartă Proiecte Publice — Cluj-Napoca

Platformă de transparență civică: vizualizează proiectele de infrastructură publică din Cluj-Napoca pe o hartă interactivă.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Mapbox GL JS (`react-map-gl`)

## Setup

1. Instalează dependențele:

```bash
npm install
```

2. Copiază fișierul de mediu și adaugă tokenul Mapbox:

```bash
cp .env.local.example .env.local
```

Editează `.env.local` și înlocuiește placeholder-ul cu tokenul tău public de la [Mapbox](https://account.mapbox.com/access-tokens/).

3. Pornește serverul de dezvoltare:

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

## Structură

- `lib/projects.ts` — date seed (6 proiecte reale din Cluj)
- `components/MapView.tsx` — hartă full-screen
- `components/ProjectPin.tsx` — pin colorat după status
- `components/ProjectDetailPanel.tsx` — panou detalii (desktop / bottom sheet mobil)
- `components/StatusBadge.tsx` / `StatusTimeline.tsx` — UI status
