# Totul Cluj

**Transparență civică și orașul de 15 minute — Cluj-Napoca**

Platformă web live pentru **Cluj Hackathon 2026 · Digital Romania**

| | |
|---|---|
| **Site** | [https://totulcluj.ro](https://totulcluj.ro) |
| **Hartă (aplicația principală)** | [https://totulcluj.ro/harta](https://totulcluj.ro/harta) |
| **Autentificare** | [https://totulcluj.ro/login](https://totulcluj.ro/login) |
| **Panou admin** | [https://totulcluj.ro/admin](https://totulcluj.ro/admin) (după login staff) |

---

## În două fraze

**Totul Cluj** este un serviciu public digital modern: landing page de prezentare + hartă interactivă unde vezi proiectele de investiții din Cluj, filtrezi după status și categorie, și calculezi **ce poți atinge pe jos în 15 minute** din orice punct al orașului. Cetățenii pot folosi harta fără cont; cu **autentificare mock-up** (parolă + 2FA simulate, fără ROeID real) salvează locațiile favorite, iar funcționarii administrează proiectele într-un panou cu **registru de audit imutabil**.

> **Prezentare hackathon:** focus pe **web** (landing + `/harta` + admin). **Librării, funcții 2FA/date/securitate:** [secțiune dedicată](#librării-folosite-funcții-importante-și-securitate). Prototip Android: [Partea II](#partea-ii--prototip-mobil-android).

---

## Descriere proiect

**Totul Cluj** răspunde unei probleme foarte concrete: cetățeanul vede lucrări, șantiere și promisiuni publice, dar informația oficială este greu de găsit, greu de înțeles și rareori pusă în contextul vieții de zi cu zi. Proiectul transformă date administrative și date deschise într-o experiență vizuală simplă: intri pe site, vezi ce se construiește în Cluj, cât costă, în ce stadiu este, dacă e întârziat și ce servicii ai în jurul unei locații în 15 minute de mers pe jos.

Produsul are trei zone principale:

- **Landing page** — explică pe înțelesul oricui ce problemă rezolvă platforma, de ce contează transparența civică și direcționează utilizatorul spre hartă sau autentificare.
- **Hartă publică** — aplicația principală: proiecte publice, cartiere, filtre, panou de detalii, plus modul **Scor 15 minute** cu isocronă, facilități OpenStreetMap și scor de accesibilitate.
- **Panou instituțional** — zonă pentru funcționari/admini, cu CRUD proiecte, import URL/PDF asistat de AI și registru de audit cu hash chain pentru modificări.

Autentificarea și 2FA sunt **mock-up** pentru demo. Nu pretindem integrare reală cu ROeID sau trimitere reală de SMS/email; demonstrăm fluxul cerut în ghid și separarea rolurilor.

---

## Librării folosite — rezumat rapid

| Librărie / tehnologie | Unde apare | De ce am folosit-o |
|-----------------------|------------|--------------------|
| **Next.js 15** | `app/`, `app/api/` | Framework full-stack: landing, hartă, admin și API în același proiect. |
| **React 18** | `components/` | UI componentizat: hartă, panouri, formulare admin, login 2FA. |
| **TypeScript** | tot proiectul web | Tipuri clare pentru proiecte, sesiuni, scoruri walk score și date admin. |
| **Tailwind CSS** | UI web | Design rapid, responsive, consistent, ușor de rafinat în 48h. |
| **Mapbox GL** + **react-map-gl** | `MapCanvas`, `WalkScoreLayer` | Hartă performantă, click pe coordonate, straturi GeoJSON, pin-uri și clustere. |
| **Mapbox Isochrone API** | `lib/isochrone.ts` | Calculează zona accesibilă în ~15 minute de mers pe jos. |
| **OpenStreetMap / Overpass** | `lib/overpass.ts` | Date reale despre facilități: școli, farmacii, transport, parcuri etc. |
| **better-sqlite3** | dev DB | Bază locală instant pentru demo: proiecte, audit, cache, pinuri salvate. |
| **SQLite** | producție Docker | Persistență simplă pentru deploy rapid pe `totulcluj.ro`. |
| **pdf-parse** | import admin PDF | Extrage text din PDF-uri pentru importul asistat de AI. |
| **OpenRouter API** | `lib/ai.ts` | Rezumă descrieri birocratice și extrage proiecte din URL/PDF. |
| **ESLint / eslint-config-next** | build/dev | Păstrează codul verificabil pentru mentori și demo. |

Detaliile cerute de ghid pentru **funcțiile importante** (2FA, date, securitate) sunt documentate complet în secțiunea [Librării folosite, funcții importante și securitate](#librării-folosite-funcții-importante-și-securitate).

---

# Partea I — Aplicația web

## Cum ne povestiți ideea (cerințe juriu)

Ghidul concurenților cere patru lucruri. Iată răspunsul nostru:

### 1. Cum se numește?

**Totul Cluj** (`totulcluj.ro`) — un nume scurt, ușor de reținut, care spune că adună „tot ce mișcă” în oraș într-un singur loc digital.

### 2. Ce face, pe scurt?

Este un **site complet**, nu doar un API:

- **Landing page** (`/`) — explică problema, valorile și direcționează spre hartă sau login.
- **Hartă interactivă** (`/harta`) — două moduri: **Proiecte** (transparență bugetară pe hartă) și **Scor 15 minute** (accesibilitate pietonală).
- **Autentificare** (`/login`) — cetățean sau funcționar/admin, cu **2FA simulat** (ca ROeID).
- **Panou admin** (`/admin/*`) — gestionare proiecte, import documente cu AI, registru audit.

Orice vizitator poate explora harta fără cont. API-ul public (`/api/projects`, `/api/walkscore`) există pentru integrări (inclusiv prototipul mobil), dar **experiența principală este UI-ul web**.

### 3. Ce problemă rezolvă?

**Frustrarea cetățeanului față de stat:** informația despre proiecte publice e îngropată în PDF-uri bugetare; nu știi ce se construiește lângă tine, cât costă sau când se termină. La fel, când alegi unde locuiești, nu ai un răspuns rapid la „ce am la 15 minute pe jos?” (școală, farmacie, transport).

**Totul Cluj** reduce birocrația percepută: mai puțin timp pierdut, mai multă transparență, decizii informate — fără jargon, pe hartă, de pe telefon sau desktop.

### 4. Ce date folosiți?

| Date | Sursă | Cum le folosim |
|------|--------|----------------|
| Proiecte publice | Seed local (15 investiții model Cluj 2026) + introduse de admin | Pin-uri pe hartă: buget, status, progres, instituție |
| Facilități urbane | **OpenStreetMap** via Overpass API | Puncte POI în zona de mers pe jos |
| Zonă 15 minute | **Mapbox Isochrone API** | Poligon pietonal real |
| Cartiere | `public/cartiere-cluj.geojson` | Context local pe hartă |
| Cache walk score | SQLite (`walk_pins`) | Răspuns rapid, fără recalcul la fiecare click |
| Pinuri salvate | SQLite (`saved_pins`) | Preferințe cetățean autentificat |
| Audit admin | SQLite (`audit_ledger`) | Istoric modificări, lanț hash |

Date simulate respectă structuri realiste (buget RON, coordonate, status administrativ). Extinderi viitoare: [data.gov.ro](https://data.gov.ro), INSSE, ONRC. Inspirație UX: [demoanaf.ro](https://demoanaf.ro), transparență digitală.

---

## Experiența produsului web

### Landing page — [totulcluj.ro](https://totulcluj.ro)

Prima impresie pentru juriu și cetățeni. Nu e o pagină tehnică — e **povestea produsului**:

| Secțiune | Conținut |
|----------|----------|
| **Hero** | „Tot ce se construiește în Cluj, într-un singur loc” + CTA „Deschide harta” |
| **Problema** | PDF-uri bugetare pe care nimeni nu le citește; șantierul din spatele gardului |
| **Ce găsești** | 6 carduri: hartă, 15 minute, detalii proiecte, rezumate AI, notificări*, raportare* |
| **Orașul în 15 minute** | Explicație vizuală + link direct către `/harta` |
| **Impact civic** | De ce contează transparența pentru comunitate |
| **Header** | Navigare: Despre, Hartă, Login cetățean, Login admin |

\* *Notificări și raportare cetățenească: direcție de produs pe landing; pe web live sunt implementate harta, walk score, pinuri salvate și admin sesizări (fără formular public încă).*

Design: paletă navy `#0D1B2A` + accent auriu `#F0A500`, tipografie Plus Jakarta Sans, responsive mobile-first, focus vizibil pe link-uri.

---

### Hartă interactivă — [totulcluj.ro/harta](https://totulcluj.ro/harta)

**Aplicația centrală.** Ecran full-screen Mapbox, centrat pe Cluj-Napoca.

#### Mod **Proiecte** — transparență bugetară

Ce face utilizatorul:

1. Deschide harta — vede **15 proiecte** ca pin-uri colorate după status (Inițiat → Aprobat → Bugetat → În lucru → Finalizat).
2. Pin-urile întârziate au contur roșu.
3. Filtrează din header: **categorie** (infrastructură, parcuri, transport, educație, utilități), **doar întârziate**, **status** din legendă (click pe legendă).
4. Apasă un pin → **panou detaliu** (jos pe mobil, dreapta pe desktop):
   - titlu, categorie, status, badge „Întârziat”
   - bară progres %, buget formatat RON, sursă finanțare
   - date început / termen planificat
   - descriere (text simplu dacă admin a generat rezumat AI)
   - **cronologie status** (`StatusTimeline`)
5. Strat **cartiere**: contururi subtile + nume cartier — context local fără aglomerare.

Controale: recentrare Cluj, navigare Mapbox, număr proiecte vizibile vs. total.

#### Mod **Scor 15 minute** — orașul accesibil pe jos

Inspirat din conceptul „15-minute city”, adaptat pentru Cluj:

1. Utilizatorul comută tab **Scor 15 minute** (hint: „Apasă pe hartă…”).
2. **Click pe hartă** → pin + calcul automat:
   - isocronă Mapbox (~15 min mers pe jos)
   - facilități OSM în poligon (școli, farmacii, parcuri, transport, etc.)
   - **scor general 0–100** + scor pe **9 categorii** (Educație, Sănătate, Comercial, Cultură, Transport, Parcuri, Sport, Bănci, Restaurante)
3. **Panoul de scor** arată:
   - scor mare colorat după calitate
   - număr facilități în zonă
   - bare progres per categorie, cu subcategorii (ex. grădinițe, farmacii, ATM)
   - toggle **„Arată doar cele mai relevante”** (cele mai apropiate POI per categorie)
   - checkbox-uri: ce categorii apar pe hartă (Toate / Niciuna)
4. Pe hartă: poligon teal semi-transparent, pin drop, **cluster facilități** cu iconițe pe categorie; hover/click pentru nume POI.

Demo rapid: Piața Unirii, Mănăștur, Iris, Gheorgheni (4 zone pre-cache în DB după setup).

Mesaje clare la încărcare și la eroare (ex. Overpass ocupat).

#### Cetățean autentificat pe hartă

După login (vezi mai jos):

- Buton **„Pinii mei”** — drawer cu locațiile walk score salvate
- **Inimă** în panoul scor — salvează/elimină pin (deduplicare ~50 m)
- Selectare pin salvat → hartă zboară acolo + recalculează scorul
- Toast confirmare („Pin salvat!” / „Pin eliminat”)

---

### Autentificare — **mock-up** (simulare ROeID, fără integrare reală)

> **Important pentru juriu:** întregul flux de identitate este **simulat** — nu există conexiune la ROeID, STS, SMS gateway sau baze de utilizatori reale. Conturile demo sunt hardcodate; parolele sunt comparate în clar în memorie; codul OTP **nu este trimis** undeva — UI-ul imită experiența reală pentru prototip.

Flux în două pași (ca în ghidul hackathon):

```
Credențiale (mock) → Verificare 2FA (mock) → Sesiune cookie → redirect
```

| Pas | UX | Tehnic |
|-----|-----|--------|
| Alegere tip | Cetățean vs. funcționar/admin | `/login?type=citizen` sau `admin` |
| Parolă | Email + parolă, validare, erori RO | `POST /api/auth/login` |
| 2FA | 6 casete OTP, timer 2 min, retrimite cod | Cookie pending semnat HMAC |
| Demo OTP | UI arată „cod trimis la email”; **orice 6 cifre** trec (ex. `123456`) | **Mock** — nu se trimite SMS/email |
| Sesiune | Redirect: cetățean → `/harta`, staff → `/admin` | Cookie `httpOnly` |

**Conturi demo**

| Rol | Email | Parolă |
|-----|--------|--------|
| Cetățean | `ion.popescu@gmail.com` | `demo123` |
| Cetățean | `ana.muresan@gmail.com` | `demo123` |
| Funcționar | `functionar@primarie.cluj` | `totulcluj2026` |
| Administrator | `admin@totulcluj.ro` | `totulcluj2026` |

Fișiere: `app/login/page.tsx`, `lib/auth.ts`, `lib/auth-2fa.ts`, `lib/auth-session.ts`.

---

### Panou admin — pentru instituții

Acces doar rol `admin` / `civil_servant` (`middleware.ts` pe `/admin/*`).

| Secțiune | Ce poate face funcționarul |
|----------|---------------------------|
| **Registru audit** | Vizualizează istoricul modificărilor; lanț `prev_hash` → `data_hash` SHA-256; indicator „lanț valid” |
| **Proiecte** | Listă, căutare, creare, editare câmpuri, schimbare status cu notă |
| **Import** | Lipește URL pagină primărie / upload PDF → **AI extrage proiecte** → previzualizare → salvare |
| **Rezumat AI** | La proiect nou, descriere birocratică → `description_plain` pe harta publică |
| **Sesizări** | Listă rapoarte cetățenești, schimbare status, notă rezolvare (pregătit pentru flux viitor) |

UI: sidebar pe desktop, bară navigare jos pe telefon — același admin merge pe mobil.

---

## Cerințe tehnice din ghid (securitate & încredere)

> Detaliu funcții și fișiere: [Librării, funcții importante și securitate](#librării-folosite-funcții-importante-și-securitate). **Autentificarea întregă = mock-up** (conturi demo, OTP fără SMS real).

### Date nemodificabile — registru audit

Tabel `audit_ledger`: fiecare acțiune admin (CREATE, UPDATE_STATUS, UPDATE_DETAILS) primește `data_hash = SHA-256(prev_hash + timestamp + user + acțiune + entitate + valoare)`.

- **Principiu:** ce s-a întâmplat rămâne consemnat; modificarea ascunsă a istoricului rupe lanțul.
- **Verificare:** `verifyAuditRows()` pe pagina admin.
- Cod: `lib/audit-ledger-core.ts`, `lib/audit-ledger.ts`, `migrations/0004_ledger.sql`.

Există și `ledger_entries` pentru evenimente pe sesizări (`lib/ledger.ts`).

### Acces controlat la date

| Actor | Ce vede / modifică |
|-------|---------------------|
| **Vizitator** | Landing, hartă publică, walk score |
| **Cetățean** | + pinuri salvate proprii |
| **Funcționar / Admin** | + panou admin, CRUD proiecte, audit |
| **Sisteme** | API REST; fără expunere credențiale în repo |

### Accesibilitate (serviciu public)

Implementat:

- `lang="ro"`; etichete ARIA pe pin-uri, panouri, dialoguri
- Navigare tastatură: `Escape` închide panouri; OTP cu focus între casete
- Contrast și ierarhie vizuală pe landing și hartă
- Layout responsive — **gândit mobile-first** (cetățenii folosesc telefonul)

De extins: audit WCAG 2.1 AA complet, testare cititor ecran sistematică.

### Design & fluiditate (cerințe UX ghid)

- **Viteză:** cache walk score; skeleton/spinner la calcule; hartă Mapbox GPU
- **Tranziții:** panouri slide 150–300 ms; toggle mod hartă animat
- **Feedback:** toast pin salvat, erori în română, stări loading explicite
- **Curat:** spațiere generoasă, legendă clară, panouri care „respiră”
- **Test:** dă telefonul cuiva — poate găsi un proiect și un scor 15 min fără explicații lungi

---

## Demo live — parcurgere recomandată (~3 min)

1. **[totulcluj.ro](https://totulcluj.ro)** — scroll landing, apasă „Deschide harta”.
2. **`/harta` → Proiecte** — click pin, citește panoul, filtrează „În lucru”.
3. **`/harta` → Scor 15 minute** — click centru oraș, explorează scor + categorii.
4. **Login cetățean** — salvează pin, deschide „Pinii mei”.
5. **(Opțional) Login admin** — registru audit + listă proiecte.

---

## Checklist predare (din ghidul concurenților)

| | Cerință | Status |
|---|---------|--------|
| ☐ | Explicăm în două fraze pe cine ajutăm | ✅ secțiunea de sus |
| ☐ | Cele 4 puncte (nume, ce face, problemă, date) | ✅ |
| ☐ | Login + 2FA simulate | ✅ `/login` (mock-up complet) |
| ☐ | Date importante de neșters (ledger) | ✅ `audit_ledger` |
| ☐ | Acces controlat (cetățean / funcționar) | ✅ |
| ☐ | Ușor de folosit, tastatură, contrast | ⚠️ parțial |
| ☐ | Rapid, tranziții, feedback | ✅ |
| ☐ | Design modern > apps stat actuale | ✅ |
| ☐ | Merge pe telefon, tabletă, desktop | ✅ |
| ☐ | Link live + README clar (librării, funcții 2FA/date/securitate) | ✅ secțiunea de mai sus |

---

## Librării folosite, funcții importante și securitate

*Cerință explicită din ghidul concurenților: „Spuneți ce librării ați folosit și de ce și comentați funcțiile importante (simularea 2FA, partea de date, logica de securitate)."*

### Avertisment: autentificarea este mock-up

| Ce pare în UI | Ce se întâmplă de fapt |
|---------------|------------------------|
| „Intru ca cetățean / funcționar” | Alegere rol; fără SSO guvernamental |
| Email + parolă | Listă fixă `getAuthUsers()` din `lib/auth.ts`; parolă comparată plain-text |
| „Am trimis cod la email…” | Text de scenariu; **niciun email/SMS nu pleacă** |
| Cod OTP 6 cifre | Orice combinație validă de format trece în `app/api/auth/verify-2fa/route.ts` |
| Sesiune „autentificat” | Cookie semnat local; suficient pentru demo roluri |

În producție reală s-ar înlocui cu ROeID/OAuth + TOTP/SMS real + store utilizatori securizat. Pentru hackathon, mock-ul demonstrează **fluxul UX** și **separarea rolurilor** (cetățean vs. staff).

---

### Librării și motivația alegerii

| Librărie | Versiune (aprox.) | De ce |
|----------|------------------|--------|
| **next** | 15.x | Framework full-stack: pagini (landing, hartă, admin), API Routes, SSR; un singur repo |
| **react** / **react-dom** | 18.x | UI componentizat pentru hartă, panouri, formulare admin |
| **typescript** | 5.x | Tipuri pentru proiecte, walk score, sesiuni — mai puține erori la demo |
| **tailwindcss** | 3.x | Stil rapid, responsive mobile-first, paletă consistentă landing + hartă |
| **mapbox-gl** | 3.x | Randare hartă GPU, straturi GeoJSON cartiere, isocronă |
| **react-map-gl** | 7.x | Integrare declarativă Mapbox în React (pin-uri, click hartă, cluster amenities) |
| **better-sqlite3** | 11.x | SQLite sincron în dev; setup instant `npm run db:setup` fără server DB separat |
| **pdf-parse** | 2.x | Extragere text din PDF-uri admin (import proiecte) |
| **eslint** + **eslint-config-next** | 8.x / 14.x | Lint la build; calitate cod pentru review mentori |
| **@cloudflare/next-on-pages** + **wrangler** | dev | Opțional: deploy alternativ Cloudflare D1/Pages |
| **OpenRouter** (via `fetch` în `lib/ai.ts`) | API extern | LLM pentru import URL/PDF și rezumate `description_plain` — fără SDK greu |

**Mobile (prototip):** Kotlin Multiplatform, Jetpack Compose, Ktor, kotlinx.serialization, Mapbox Android SDK 11.9 — vezi [Partea II](#partea-ii--prototip-mobil-android).

---

### Funcții importante — simularea 2FA și autentificarea (mock)

| Funcție / fișier | Rol |
|------------------|-----|
| **`getAuthUsers()`** — `lib/auth.ts` | Returnează lista mock de utilizatori (cetățeni + staff). Poate fi suprascrisă cu env `AUTH_USERS` (JSON). |
| **`verifyCredentials(email, password)`** — `lib/auth.ts` | Caută user în listă; compară parola **în clar** (demo). Returnează `SessionUser` sau `null`. |
| **`POST /api/auth/login`** — `app/api/auth/login/route.ts` | Dacă credențialele mock sunt OK: generează `tempToken`, creează cookie pending 2FA, răspunde `{ step: "2fa" }`. |
| **`generateTempToken()`** — `lib/auth-2fa.ts` | Token aleator hex (6 chars) — returnat la client; în demo **nu e folosit la validare OTP**. |
| **`createPending2faToken()`** / **`parsePending2faToken()`** — `lib/auth-2fa.ts` | Payload `{ email, role, tempToken, exp }` semnat HMAC-SHA256 cu `AUTH_SECRET`; cookie `httpOnly` 120s. |
| **UI 2FA** — `app/login/page.tsx` (`TwoFactorStep`) | 6 input-uri OTP, timer 2 min, mesaj „cod trimis”; **experiență vizuală** ROeID. |
| **`POST /api/auth/verify-2fa`** — `app/api/auth/verify-2fa/route.ts` | Verifică doar că există cookie pending + cod are 6 cifre; **nu compară cu `tempToken`**. Emite sesiune. |
| **`createSessionToken()`** / **`parseSessionToken()`** — `lib/auth-session.ts` | JWT-like: payload user + `exp`, semnat HMAC; cookie sesiune 7 zile, `httpOnly`. |
| **`getSession()`** / **`requireCitizenSession()`** — `lib/auth.ts` | Citește cookie sesiune; folosit pe `/harta` și `/api/pins/*`. |
| **`middleware()`** — `middleware.ts` | Blochează `/admin/*` dacă sesiunea lipsește sau rolul nu e staff. |

**Rezumat mock 2FA:** pasul 1 validează user demo; pasul 2 validează **formatul** codului, nu un secret real — suficient pentru a arăta juriului fluxul cerut în ghid.

---

### Funcții importante — partea de date

#### Proiecte publice (hartă)

| Funcție / fișier | Rol |
|------------------|-----|
| **`loadProjects()`** — `lib/public-projects.ts` | `SELECT * FROM projects` → mapare `DbProject` → `PublicProject` pentru hartă și API. |
| **`mapToPublicProject(row)`** — `lib/map-public-project.ts` | Traduce schema admin (`planned`, `mobility`, …) în etichete RO pentru cetățean (`Inițiat`, `Infrastructură rutieră`, progres %). |
| **`GET /api/projects`** — `app/api/projects/route.ts` | JSON public, fără auth. |
| **Seed** — `migrations/0002_seed_projects.sql` | 15 proiecte model Cluj 2026 (buget, coordonate, descrieri). **Date simulate**, structură realistă. |

#### Scor 15 minute (date live + cache)

| Funcție / fișier | Rol |
|------------------|-----|
| **`computeWalkScoreAt(lng, lat)`** — `lib/compute-walkscore.ts` | Orchestrare: cache → isocronă → Overpass → filtrare poligon → scoruri → salvare. |
| **`findCachedWalkPin()`** / **`saveWalkPin()`** — `lib/walk-db.ts` | Cache în `walk_pins` dacă pinul e în raza `WALK_CACHE_RADIUS_M` (50 m). |
| **`fetchWalkingIsochrone()`** — `lib/isochrone.ts` | Apel Mapbox Isochrone API (~15 min walk). |
| **`fetchAmenitiesInBbox()`** — `lib/overpass.ts` | Query Overpass OSM în bounding box; mesaj RO dacă serviciul e ocupat. |
| **`computeScores()`** / **`computeOverallScore()`** — `lib/walkscore.ts` | Algoritm scor pe categorii (cap + weight din `lib/walkscore-config.ts`). |
| **`GET /api/walkscore`** — `app/api/walkscore/route.ts` | Endpoint public; returnează GeoJSON isocronă + amenities + scoruri. |

#### Pinuri cetățeni, audit, setup

| Funcție / fișier | Rol |
|------------------|-----|
| **`listSavedPinsForUser()`** / **`createSavedPin()`** — `lib/saved-pins.ts` | CRUD pinuri walk per `user_email` (cetățean autentificat mock). |
| **`appendAuditEntry()`** — `lib/audit-ledger.ts` | Inserează rând în `audit_ledger` cu hash legat de intrarea anterioară. |
| **`computeDataHash()`** / **`verifyAuditRows()`** — `lib/audit-ledger-core.ts` | SHA-256 lanț; verificare integritate pe pagina admin. |
| **`writeLedgerEntry()`** — `lib/ledger.ts` | Evenimente pe sesizări în `ledger_entries` (hash chain separat). |
| **`scripts/init-dev-db.mjs`** | Aplică migrări + seed: proiecte, walk_pins demo, audit_ledger, saved_pins. |

**Tip date:** proiecte = **simulate/seed**; walk score = **OSM + Mapbox live** cu cache local; utilizatori = **mock**; audit = **simulare registru distribuit** (lanț hash, nu blockchain real).

---

### Funcții importante — logica de securitate

| Mecanism | Implementare |
|----------|----------------|
| **Separare roluri** | `citizen` → doar hartă + pinuri proprii; `civil_servant` / `admin` → panou admin. Verificat în `middleware.ts` și `withAdminAuth()` (`lib/api-auth.ts`). |
| **Cookie-uri** | Pending 2FA și sesiune: `httpOnly`, `sameSite: lax`, `secure` în producție — nu expun token în JS client. |
| **Semnături** | HMAC-SHA256 pe token-uri pending și sesiune (`AUTH_SECRET`); invalidarea la expirare (`exp`). |
| **API pinuri** | `requireCitizenSession()` pe `/api/pins/*` — doar user mock autentificat accesează pinurile sale. |
| **Imutabilitate audit** | `appendAuditEntry` doar INSERT; hash depinde de `prev_hash` — alterarea trecutului invalidează `verifyAuditRows()`. |
| **Fără secrete în repo** | Parole demo documentate; `AUTH_SECRET`, Mapbox, OpenRouter în `.env.local` (gitignored). |

**Ce nu e securitate production-grade (conscious mock):** parole plain-text în cod, OTP fără secret, utilizatori fără bcrypt, fără rate limiting login.

---

## Dezvoltare locală

**Node.js 20 sau 22 LTS** (evitați v24).

```bash
npm install
cp .env.local.example .env.local
# Setați NEXT_PUBLIC_MAPBOX_TOKEN

npm run db:setup   # .dev.db: proiecte, walk_pins demo, audit_ledger, saved_pins
npm run dev
```

| Local | |
|-------|---|
| http://localhost:3000 | Landing |
| http://localhost:3000/harta | Hartă |
| http://localhost:3000/login | Auth |

```bash
npm run build
npm run lint
```

---

## Deploy producție

```bash
docker build \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN="$NEXT_PUBLIC_MAPBOX_TOKEN" \
  -t hackathon26cluj:latest .
```

Producție: **https://totulcluj.ro** (container Docker, healthcheck `GET /api/projects`).

---

## Mapare criterii jurizare

| Criteriu | Pct | Cum livrăm pe web |
|----------|-----|-------------------|
| **Impact social** | 25 | Transparență proiecte + decizie locuire (15 min walk) |
| **UX / Usability** | 25 | Landing + hartă dual-mode, limbaj simplu RO, mobile-first |
| **Fezabilitate tehnică** | 20 | OSM/Mapbox live, ledger hash, auth roluri, deploy real |
| **Demo funcțional** | 20 | Site live + conturi demo + parcurs 3 min |
| **Digital Romania** | 10 | Serviciu public modern, date deschise, cetățean centru |

---

## Structură cod & fișiere importante

```
app/(home)/page.tsx     → landing /
app/harta/page.tsx      → hartă principală
app/login/              → autentificare 2FA
app/admin/              → panou instituții
components/MapView.tsx  → orchestrare hartă (moduri, pinuri, walk)
components/WalkScorePanel.tsx
lib/compute-walkscore.ts
lib/auth-2fa.ts
lib/audit-ledger-core.ts
migrations/             → schema SQL
public/cartiere-cluj.geojson
```

---

# Partea II — Prototip mobil (Android)

> **Prioritate pitch:** web (Partea I). Mobile e **work in progress** — menționăm că există, dar nu e necesar la demo live dacă nu apucăm.

Am construit un prototip **Android** (Kotlin Multiplatform + Jetpack Compose) care **replică experiența de hartă** din browser, consumând aceeași infrastructură live:

| Funcție mobilă | Status |
|----------------|--------|
| Hartă Mapbox, centrată Cluj | ✅ |
| Strat cartiere (GeoJSON local) | ✅ |
| Pin-uri proiecte (`GET /api/projects`) | ✅ |
| Mod **Proiecte** / **Scor 15 minute** | ✅ |
| Tap hartă → isocronă + facilități + panou categorii | ✅ |
| Login cetățean, pinuri salvate | ❌ viitor (doar pe web) |

**De ce există:** serviciile publice se folosesc preponderent de pe telefon; extinderea naturală post-hackathon este app nativă cu aceleași date.

**Build:** vezi [mobile/README.md](./mobile/README.md) — `local.properties` cu `MAPBOX_PUBLIC_TOKEN`, `./gradlew :androidApp:assembleDebug`.

---

## Licență · echipă

**Cluj Hackathon 2026 · Digital Romania**

*[Completați numele echipei și licența.]*

Unelte folosite: Cursor, Mapbox, OpenStreetMap, Next.js.
