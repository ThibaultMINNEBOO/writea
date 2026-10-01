# Writea — atelier d'écriture en ligne (Cloudflare Worker + Hono + Drizzle + shadcn)

## Contexte

Le dépôt `/Users/admin/writea` est vide (seulement des skills agents). Il faut créer de zéro une application francophone pour écrire une œuvre chapitre par chapitre. Elle doit être plus utile qu'un éditeur hors ligne : synchronisation dans le cloud, historique des versions, relecture partagée par lien, synonymes intégrés et export EPUB.

Décisions validées avec l'utilisateur :
- **Comptes** : email + mot de passe (Better Auth sur D1).
- **Synonymes** : le thésaurus français libre de LibreOffice/Dicollecte (format MyThes, LGPL/MPL), importé une fois dans D1.
- **Relecture** : le lien ouvre une version figée du chapitre. Le relecteur lit, surligne et commente avec un nom, sans compte.
- **Typographie** : un `-` en début de ligne devient `— ` (dialogue), et ` - ` entouré d'espaces devient ` — ` (incise). Les traits d'union (« peut-être ») et les listes Markdown `* ` restent intacts.

## Architecture

Le dépôt est un monorepo pnpm avec deux déploiements séparés :
- **Backend** : l'API Hono tourne sur un Cloudflare Worker (D1). Elle est déployée avec `wrangler deploy`.
- **Frontend** : une SPA React (Vite) hébergée sur **Vercel**. Elle est déployée en statique avec `apps/web` comme Root Directory du projet Vercel.

**Liaison front/back.** `apps/web/vercel.json` réécrit `/api/:path*` vers l'URL du Worker. Pour le navigateur, l'API est donc sur la même origine que le front. Les cookies de session Better Auth restent first-party : pas de cookie tiers bloqué par Safari ou Firefox, pas de CORS avec credentials. La règle SPA renvoie le reste vers `index.html`. En dev, le proxy Vite envoie `/api` vers `wrangler dev` (port 8787). L'URL publique du front est fournie au Worker (`APP_URL`, pour `trustedOrigins` et les liens de relecture). Un middleware CORS restreint à `APP_URL` reste en place pour un accès direct éventuel.

```
apps/
  api/                         Cloudflare Worker (wrangler.jsonc : D1 `DB`, nodejs_compat, vars APP_URL)
    src/index.ts               app Hono + routes, export type AppType
    src/db/schema.ts           schéma Drizzle (sqlite-core)
    src/db/client.ts           drizzle(env.DB)
    src/auth.ts                factory Better Auth par requête (D1 vient de env)
    src/middleware/            requireUser, erreurs, cors
    src/routes/                works, chapters, versions, share, review, thesaurus, export
    src/services/epub.ts       génération EPUB 3 (fflate + markdown→XHTML)
    scripts/import-thesaurus.ts  parse thes_fr.dat → SQL par lots
    drizzle/                   migrations générées
  web/                         Vite + React 19 + React Router + TanStack Query → Vercel
    vercel.json                rewrites /api → Worker + fallback SPA
    src/lib/api.ts             client typé hc<AppType> (import type depuis @writea/api)
    src/components/ui/         shadcn
    src/features/              library, editor, synonyms, versions, review, auth, theme
packages/
  shared/                      code pur partagé et testé
    typography.ts              règles tirets (éditeur + export)
    schemas.ts                 schémas zod (validation API, typage des formulaires)
    text.ts                    comptage de mots, normalisation
```

**Typage** : `strict` + `noUncheckedIndexedAccess`. Biome avec `noExplicitAny` en erreur. Types inférés de bout en bout par Drizzle, zod et Hono RPC. Commentaires réservés à ce qui n'est pas évident.

## Modèle de données (D1 / Drizzle)

- Tables Better Auth : `user`, `session`, `account`, `verification`, générées via `@better-auth/cli` puis intégrées au schéma Drizzle.
- `works` : id, userId, title, subtitle, author (nom de plume), language `fr`, createdAt, updatedAt.
- `chapters` : id, workId, title, content (markdown), position, wordGoal (nullable), updatedAt.
- `chapter_versions` : id, chapterId, label, content, wordCount, createdAt. C'est un instantané figé.
- `share_links` : token (aléatoire, 32 octets base64url), versionId, createdAt, revokedAt.
- `review_comments` : id, versionId, reviewerName, quote, startOffset, endOffset, body, createdAt, resolvedAt.
- `thesaurus` : key (mot normalisé minuscule sans accents), word, partOfSpeech, synonyms (JSON text[]), avec un index sur key.

Toutes les requêtes passent par un contrôle de propriété (`works.userId = user.id`), sauf `/api/review/:token` qui passe par le token.

## API (Hono, validation `@hono/zod-validator`)

- `/api/auth/*` → handler Better Auth.
- `GET/POST /api/works`, `GET/PATCH/DELETE /api/works/:id`
- `GET/POST /api/works/:id/chapters`, `PATCH /api/chapters/:id` (autosave du contenu/titre), `DELETE`, `PUT /api/works/:id/chapters/order`
- `GET/POST /api/chapters/:id/versions`, `POST /api/versions/:id/restore`
- `POST /api/versions/:id/share` → `{ url }`, `DELETE /api/share/:token`, `GET /api/chapters/:id/comments` (vue auteur), `PATCH /api/comments/:id` (résoudre)
- Public : `GET /api/review/:token` (version + commentaires), `POST /api/review/:token/comments`
- `GET /api/thesaurus?q=mot` → synonymes groupés par sens/nature. Correspondance exacte d'abord, puis repli sur la forme normalisée sans accents.
- `GET /api/works/:id/export.epub` → `application/epub+zip`

**EPUB** (`services/epub.ts`) : EPUB 3 valide, avec `mimetype` en premier et non compressé (fflate `zipSync`, niveau 0 pour ce fichier). Il contient `META-INF/container.xml`, `content.opf` (dc:language `fr`), `nav.xhtml`, un XHTML par chapitre (markdown → HTML via `marked`, échappé et rendu en XHTML), une CSS typographique (alinéas, dialogues) et une page de titre. On applique `applyFrenchDashes` au contenu par sécurité.

## Frontend

- **Thème** : un preset tweakcn au ton « papier/littéraire » (`npx shadcn@latest add https://tweakcn.com/r/themes/vintage-paper.json`, avec repli possible sur `mocha-mousse`), avec ses variables clair et sombre. `ThemeProvider` gère clair / sombre / système, persiste dans localStorage et s'affiche via un toggle dans la barre.
- **Pages** : `/connexion`, `/inscription`, `/` (bibliothèque : cartes d'œuvres, mots totaux), `/oeuvres/:id` (espace d'écriture), `/relecture/:token` (page publique).
- **Espace d'écriture** :
  - La barre latérale gauche liste les chapitres (dnd-kit pour réordonner, ajout rapide) et se replie.
  - Au centre, un éditeur **CodeMirror 6** (`@codemirror/lang-markdown`). Son thème suit les variables CSS shadcn : police serif, colonne d'environ 70 caractères, titres et emphase stylés en place.
  - Une extension `inputHandler` applique les règles de tirets à la frappe, via `shared/typography.ts`.
  - Autosave avec debounce (environ 800 ms) et indicateur « Enregistré / Enregistrement… ».
  - **Mode focus** (masque tout, raccourci `⌘⇧F`) et **défilement machine à écrire**.
  - Compteur de mots du chapitre, barre de progression vers l'objectif du chapitre, mots écrits pendant la session.
  - Le panneau droit (Sheet/onglets) contient les **Synonymes**, les **Versions** et les **Commentaires**.
    - Synonymes : un champ de recherche, pré-rempli par le mot sélectionné (`⌘⇧S`). Cliquer un synonyme remplace la sélection.
    - Versions : « Figer cette version » (avec libellé), liste, restauration, bouton « Partager pour relecture » qui copie le lien.
    - Commentaires : les commentaires des relecteurs par version, avec la citation surlignée et un bouton « Résolu ».
- **Page de relecture** : rendu lecture soigné (markdown → HTML). Une sélection de texte ouvre un popover pour saisir un nom (mémorisé en localStorage) et un commentaire. Les ancres sont des offsets dans le markdown source plus la citation.
- Toute l'interface est en français, avec dates et nombres via `Intl` `fr-FR`.

## Ordre d'implémentation (un commit par étape, Conventional Commits)

1. `docs: spec de conception` → copie de ce plan dans `docs/superpowers/specs/2026-10-01-writea-design.md`.
2. `chore: init monorepo` → workspace pnpm, tsconfig de base, Biome, scripts racine (`dev` lance api + web en parallèle).
3. `chore(api): worker Hono` → `wrangler.jsonc` (D1 `DB`, `nodejs_compat`, `APP_URL`), route `/api/health`.
4. `feat(web): Vite + shadcn + thème tweakcn` → init shadcn (template vite), Tailwind v4, thème, ThemeProvider avec toggle clair/sombre, proxy Vite, `vercel.json`.
5. `feat(db): schéma Drizzle + migrations D1` → `drizzle.config.ts` (driver d1-http pour le remote, migrations appliquées via `wrangler d1 migrations apply`).
6. `feat(auth): Better Auth email/mot de passe` → handler `/api/auth/*`, `trustedOrigins` = `APP_URL`, middleware `requireUser`, pages connexion/inscription (`better-auth/react`, `baseURL` relatif).
7. `feat(shared): typographie française` → `applyFrenchDashes`, en TDD avec Vitest.
8. `feat(api): œuvres et chapitres` puis `feat(web): bibliothèque`.
9. `feat(editor): éditeur CodeMirror` → tirets, autosave, compteurs, focus, machine à écrire.
10. `feat(thesaurus): import + API + panneau synonymes` → script de téléchargement et de parsing de `thes_fr.dat`, SQL par lots, `pnpm --filter api thesaurus:import`.
11. `feat(versions): instantanés et restauration`.
12. `feat(review): liens de partage + page de relecture + commentaires`.
13. `feat(export): EPUB` → service et bouton d'export.
14. `chore: README` → setup local, variables d'environnement (`APP_URL`, `BETTER_AUTH_SECRET`, URL du Worker dans `vercel.json`), déploiements Cloudflare et Vercel.

## Vérification

- `pnpm -r typecheck` (api, web, shared) et `pnpm lint` (Biome, zéro `any`).
- `pnpm test` (Vitest) :
  - `typography` : dialogue, incise, traits d'union préservés, listes `*`.
  - parser MyThes.
  - `epub` : `mimetype` en premier et non compressé, OPF valide, un fichier par chapitre.
  - routes API avec `@cloudflare/vitest-pool-workers` + D1 local : contrôle de propriété, token révoqué → 404.
- `pnpm dev` (wrangler dev sur 8787, Vite sur 5173 avec proxy `/api`), puis parcours de bout en bout dans le navigateur intégré :
  1. inscription ;
  2. création d'une œuvre et de deux chapitres ;
  3. frappe de `- Bonjour` → `— Bonjour` ;
  4. recherche de synonymes de « maison » ;
  5. version figée, lien de relecture ouvert dans un nouvel onglet, commentaire ajouté puis visible côté auteur ;
  6. export EPUB téléchargé et validé avec `epubcheck` s'il est disponible (sinon inspection `unzip -l`) ;
  7. bascule clair/sombre.
- `pnpm --filter web build` (sortie statique `dist/` pour Vercel) et `pnpm --filter api exec wrangler deploy --dry-run` (bundle du Worker). Les déploiements réels (Cloudflare et Vercel) ne se font que sur demande de l'utilisateur.
