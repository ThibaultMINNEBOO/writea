# Writea

Atelier d'écriture en ligne pour les auteurs francophones : écrire son œuvre chapitre par chapitre, la faire relire par lien et l'exporter en EPUB.

## Fonctionnalités

- **Éditeur Markdown** (CodeMirror 6), typographie soignée, mode focus (`⌘⇧F`), défilement « machine à écrire », raccourcis `⌘B` / `⌘I`.
- **Tirets français automatiques** : un `-` en début de ligne devient un tiret de dialogue `—` ; un ` - ` entre deux espaces devient une incise ` — `. Les traits d'union (« peut-être ») sont préservés. La règle s'applique à la frappe, au collage et à l'export.
- **Synonymes** : placez le curseur sur un mot puis `⌘⇧S`, ou cherchez un terme dans le panneau. Un clic remplace le mot en conservant la majuscule.
- **Sauvegarde automatique** dans le cloud, compteur de mots, objectif par chapitre et mots écrits pendant la session.
- **Versions** : figez un chapitre, restaurez une version sans rien perdre (l'état courant est conservé automatiquement).
- **Relecture par lien** : partagez une version figée ; le relecteur, sans compte, surligne un passage et laisse un commentaire. L'auteur traite les retours depuis l'éditeur et peut révoquer le lien.
- **Export EPUB 3** de l'œuvre complète (page de titre, table des matières, un fichier par chapitre).
- Mode clair / sombre / système, interface entièrement en français.

## Architecture

```
apps/api       API Hono sur Cloudflare Workers, D1 + Drizzle ORM, Better Auth
apps/web       SPA React (Vite) + shadcn/ui, thème tweakcn « Vintage Paper », hébergée sur Vercel
packages/shared  Typographie, comptage de mots, rendu Markdown et schémas zod partagés
```

Le front appelle l'API sur `/api/*`. Sur Vercel, ces requêtes sont réécrites vers le Worker (`apps/web/vercel.json`), ce qui garde le front et l'API sur la même origine : les cookies de session restent de première partie et aucun CORS n'est nécessaire. En local, le proxy Vite joue ce rôle.

Les types de l'API sont partagés avec le front via le client RPC de Hono (`hc<AppType>`), sans génération de code.

## Développement local

Prérequis : Node 22+ et pnpm 11.

```bash
pnpm install
```

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Renseignez ensuite `BETTER_AUTH_SECRET` (au moins 32 caractères aléatoires, par exemple `openssl rand -base64 32`).

```bash
pnpm --filter @writea/api db:migrate:local
```

```bash
pnpm --filter @writea/api thesaurus:import:local
```

```bash
pnpm dev
```

L'application est servie sur http://localhost:5173 et l'API sur http://localhost:8787.

## Qualité

```bash
pnpm typecheck
```

```bash
pnpm lint
```

```bash
pnpm test
```

Les tests de l'API s'exécutent dans le runtime Workers (`@cloudflare/vitest-pool-workers`) avec une base D1 migrée. TypeScript est en mode strict et Biome interdit `any`.

## Déploiement

### API (Cloudflare Workers)

1. Créez la base : `pnpm --filter @writea/api exec wrangler d1 create writea`, puis reportez le `database_id` dans `apps/api/wrangler.jsonc`.
2. Remplacez `APP_URL` dans `wrangler.jsonc` par l'URL publique du front (par exemple `https://writea.vercel.app`).
3. Définissez le secret : `pnpm --filter @writea/api exec wrangler secret put BETTER_AUTH_SECRET`.
4. Appliquez les migrations : `pnpm --filter @writea/api db:migrate:remote`.
5. Importez le thésaurus : `pnpm --filter @writea/api thesaurus:import:remote`.
6. Déployez : `pnpm --filter @writea/api run deploy`.

### Front (Vercel)

1. Importez le dépôt dans Vercel avec `apps/web` comme *Root Directory* (le monorepo pnpm est détecté automatiquement).
2. Dans `apps/web/vercel.json`, remplacez `https://writea-api.example.workers.dev` par l'URL de votre Worker.
3. Déployez.

## Migrations

Le schéma est défini dans `apps/api/src/db/schema.ts`. Après modification :

```bash
pnpm --filter @writea/api db:generate
```

Attention : D1 applique toujours les clés étrangères. Une migration qui reconstruit une table (`DROP TABLE` puis recréation, générée par Drizzle pour certains changements SQLite) déclenche les suppressions en cascade sur les tables liées. Relisez chaque migration générée avant de l'appliquer en production.

## Crédits

Le dictionnaire des synonymes provient du thésaurus français myThes de Frédéric Labbé (projet Dicollecte / Grammalecte), distribué par LibreOffice sous licence LGPL 2.1 ou ultérieure. Il est téléchargé au moment de l'import et n'est pas versionné dans ce dépôt.
