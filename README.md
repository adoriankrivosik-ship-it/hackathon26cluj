# Hartă Proiecte Publice — Cluj-Napoca

Platformă de transparență civică: vizualizează proiectele de infrastructură publică din Cluj-Napoca pe o hartă interactivă.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Mapbox GL JS (`react-map-gl`)
- Cloudflare D1 (proiecte publice)

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

3. Creează baza locală pentru development:

```bash
npm run db:setup
```

Aceasta generează `./.dev.db` (SQLite) cu schema + cele 6 proiecte seed. `npm run dev` citește din acest fișier.

Pentru D1 Wrangler local (opțional, deploy Cloudflare):

```bash
npm run db:setup:wrangler
```

4. Pornește serverul de dezvoltare:

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000). Acceptă permisiunea de locație dacă vrei poligonul de 15 minute pe jos.

## Date (D1)

| Tabel | Migrare | Conținut |
|-------|---------|----------|
| `projects` | `migrations/0001_projects.sql` | Schema |
| (seed) | `migrations/0002_seed_projects.sql` | 6 proiecte |

Acces: `lib/db.ts` → `loadProjects()` / `getProjects(DB)`. Dev: `better-sqlite3` + `.dev.db`. Producție (Cloudflare Pages): binding D1 via `@cloudflare/next-on-pages`. Pagina `app/page.tsx` încarcă proiectele și le trimite la `MapView`.

API opțional: `GET /api/projects` (JSON).

## Structură

- `lib/db.ts` — citire D1, mapare snake_case → `PublicProject`
- `lib/projects.ts` — tipuri, `PROJECT_STATUSES`, formatters (fără array hardcodat)
- `lib/geo.ts` — utilitare geometrie (pentru viitoare funcții)
- `components/MapView.tsx` — hartă + filtre + legendă
- `wrangler.toml` — binding `DB` → D1
