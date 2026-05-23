# Hartă Proiecte Publice — Cluj-Napoca

Platformă de transparență civică: vizualizează proiectele de infrastructură publică din Cluj-Napoca pe o hartă interactivă.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Mapbox GL JS (`react-map-gl`)
- Cloudflare D1 (proiecte publice)

## Landing page (Totulcluj.ro)

Pagina de prezentare este la **`/landing`**, nu la rădăcină (`/`).

După `npm run dev`, deschide:

**[http://localhost:3000/landing](http://localhost:3000/landing)**

Nu necesită Mapbox, baza de date sau `db:setup` — este statică.

## Setup

**Node.js:** folosește **v20 sau v22 LTS** (nu v24). Pe Windows, `better-sqlite3` (pentru harta de la `/`) necesită binare precompilate sau Visual Studio Build Tools; v24 adesea eșuează la `npm install`.

1. Instalează dependențele:

```bash
npm install
```

(Proiectul include `.npmrc` cu `legacy-peer-deps` pentru conflictele de peer deps.)

2. Copiază fișierul de mediu și adaugă tokenul Mapbox:

```bash
cp .env.local.example .env.local
```

Editează `.env.local` și înlocuiește placeholder-ul cu tokenul tău public de la [Mapbox](https://account.mapbox.com/access-tokens/).

3. Creează baza locală pentru development:

```bash
npm run db:setup
```

Generează `./.dev.db` cu proiecte + tabel `walk_pins` + 4 pinuri demo (Centru, Mănăștur, Iris, Gheorgheni).

```bash
npm run db:seed-walk   # doar pinuri walk (dacă DB există deja)
```

Pentru D1 Wrangler remote/local (deploy Cloudflare): `npm run db:setup:wrangler`

4. Pornește serverul de dezvoltare:

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000). Mod **Scor 15 minute**: apasă pe hartă pentru pin + scor walkability (OSM + Mapbox Isochrone, cache D1).

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
- `app/landing/` — landing Totulcluj.ro (`/landing`)
- `wrangler.toml` — binding `DB` → D1
