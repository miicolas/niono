# DigiPM - Claude Code Instructions

> Ce fichier guide Claude Code (et tout agent) pour développer DigiPM. Il est lu automatiquement au démarrage. `AGENTS.md` pointe vers ce fichier.

## Produit et décisions

Pour le périmètre, l'architecture et les critères de livraison, lire `docs/implementation-plan.md`. Pour la navigation et l'apparence, lire `docs/design/notion-reference.md` : la base imposée est shadcn `sidebar-10`. Avant de modifier la persistance ou les contrats, lire `CONTEXT.md` (langage du domaine) et les ADR de `docs/adr/`.

La V1 utilise Better Auth email/mot de passe et fonctionne sans temps réel. Les changements de périmètre explicitement demandés par l'utilisateur priment sur les documents historiques.

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Framework | TanStack Start (Vite + Nitro, SSR) |
| Routing | TanStack Router (file-based, type-safe) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth (email/mot de passe) |
| UI | shadcn/ui (style `new-york`, Radix, icônes lucide) + Tailwind v4 |
| API | oRPC (type-safe RPC) |
| Éditeur | Tiptap (document JSON par page, révisions) |
| Forms | React Hook Form + Zod |
| Email | React Email + Resend (outbox locale sans clé) |
| State | TanStack Query (serveur), Zustand (interface), IndexedDB (brouillons) |
| Runtime / PM | Bun |
| Hébergement | Docker Compose (image `oven/bun`) |

## Structure du Projet

```
/routes                 → Routes file-based (TanStack Router)
  __root.tsx            → Document HTML + providers
  /(auth)/              → Groupe public : route.tsx = layout + redirection si session
    sign-in.tsx, reset-password.tsx, login.tsx (redirection legacy)
    -components/, -lib/ → Composants et helpers colocalisés (préfixe `-`)
  /(application)/       → Groupe authentifié : route.tsx = guard de session
    index.tsx           → L'espace de travail (ssr: false, search params w/p/view)
    invite.tsx
    -components/{shell,sidebar,panels,page,database,invite}/
    -lib/               → hooks et helpers de l'espace (sauvegarde, navigation, import)
  /api/auth/$.ts        → Handler Better Auth
  /api/rpc/$.ts         → Handler oRPC (StrictGetMethodPlugin + BatchHandlerPlugin)
  /api/assets/$.ts      → Lecture et upload de fichiers
  /api/health.ts
router.tsx              → getRouter() + intégration SSR de Query
routeTree.gen.ts        → Généré par le plugin (committé, ne pas éditer)
server.ts               → Entrée serveur Nitro
auth.ts                 → Instance Better Auth
vite.config.ts          → tailwindcss + tanstackStart({ srcDirectory: "." }) + nitro + react
/components
  /ui/                  → shadcn/ui généré (CLI uniquement, lint désactivé)
  /editor/              → Éditeur Tiptap (extensions, menus, images, upload)
/db
  index.ts              → Pool pg + drizzle
  /schema/[domaine]/    → schema.ts, types.ts, index.ts (auth, workspaces, pages, documents, databases, assets, transfer)
/migrations             → Migrations drizzle-kit (jamais éditées à la main)
/server
  context.ts            → base = os.$context<{ headers, db }>()
  /procedure            → public.procedure.ts, protected.procedure.ts
  /middleware           → auth.middleware.ts
  /routers              → un dossier par domaine
    /[domaine]
      router.ts         → composition uniquement
      /queries          → une procédure GET par fichier + index.ts
      /mutations        → une procédure d'écriture par fichier + index.ts
    _app.ts             → registre racine (ai, databases, documents, pages, system, transfer, workspaces)
  /services/[domaine]/  → logique métier : une fonction par fichier, transactions et invariants
  /functions            → createServerFn (session pour les guards)
  /lib                  → helpers HTTP (origine, corps borné, journal) et `required()`
/orpc                   → client isomorphe (client.ts), query client (query/client.ts), serializer
/validators             → Schémas Zod par domaine (inputs oRPC et validateSearch)
/lib                    → Helpers isomorphes : editor/ (validation du document), databases/, auth/, ui/, utils.ts (cn)
/constants              → limits.ts, pages.ts, project.ts, templates.ts, emoji-icons.ts, image-types.ts
/hooks                  → Hooks globaux uniquement (use-mobile)
/emails                 → Templates React Email + components/
/env                    → env/server.ts (process.env) + env/client.ts (VITE_*)
/styles                 → globals.css (imports) + un fichier par domaine, editor.css
/scripts                → db/, backup/, smoke/, benchmarks/, testing/
/tests                  → tests/[domaine]/*.test.ts (bun:test), support/, architecture/, security/
/docs, CONTEXT.md       → Décisions, ADR, glossaire ; tickets locaux dans `.scratch/`
```

## Commandes Essentielles

```bash
bun install
bun run db:start     # Postgres local (docker compose)
bun run db:migrate   # Appliquer les migrations
bun run dev          # Dev server Vite sur :3000
bun run build        # Build production (Vite + Nitro → .output/)
bun run start        # Servir le build (bun .output/server/index.mjs)
bun run checks       # Biome + TypeScript check
bun run test         # Tests hermétiques (bun:test), sans .env ambiant
bun run db:generate  # Générer une migration après changement de schéma
bun run db:studio    # Drizzle Studio
bun run email:dev    # Prévisualisation des emails (:3001)
```

### Sécurité des tests

- `bun run test` est l'unique point d'entrée autorisé ; ne jamais lancer `bun test` directement.
- Le launcher ignore les fichiers dotenv ambiants et ne transmet que des placeholders et des services loopback (`DATABASE_URL` sur 127.0.0.1:55438, mot de passe `digipm` par défaut de `compose.yaml`).
- Ne jamais lire, sourcer, copier ou transmettre le `.env` réel pour un test. Ne jamais créer dans un worktree un symlink `.env` vers l'extérieur.

## Règles de Développement

### Routes (TanStack Router)

- Une page = un fichier dans `/routes` exportant `Route = createFileRoute(...)`.
- Groupes `(auth)` / `(application)` : le `route.tsx` du groupe est le layout ; le guard de session vit dans son `beforeLoad` (`getServerSession` + `throw redirect({ to })`).
- Search params : **TOUJOURS** `validateSearch` avec un schema Zod de `/validators`, lecture via `Route.useSearch()`. Pas de nuqs.
- L'URL est la seule autorité de l'espace, la page et la vue courantes (`w`, `p`, `view`).
- Metadata : `head: () => ({ meta: [{ title: "..." }] })` par route.
- Navigation : `Link` (`to`, pas `href`) et `useNavigate()` ; chemins dans `constants/pages.ts`.
- Fichiers colocalisés dans `/routes` : préfixe `-` (`-components/`, `-lib/`).
- `routeTree.gen.ts` est généré automatiquement — ne jamais l'éditer.

### Architecture des composants (OBLIGATOIRE)

**Toute nouvelle interface et toute refonte doivent être construites comme un ensemble de composants réutilisables, organisés par fonctionnalité. Les composants monolithiques ne sont pas acceptés.**

### Limites de taille et de responsabilité (OBLIGATOIRE)

- Aucun fichier ne doit dépasser **300 lignes** : découper avant d'atteindre cette limite (`tests/architecture/file-size.test.ts` l'impose).
- Chaque fichier de code ne doit définir qu'**une seule fonction** (fonction, composant ou procédure principale) ; déplacer chaque helper dans son propre fichier.
- Le fichier de route reste minimal : déclaration TanStack Router, metadata, validation des search params et composition du composant principal.
- Colocaliser chaque feature dans un dossier dédié (`routes/(application)/-components/page/`) avec ses composants, hooks, données et helpers privés.
- Un fichier `.tsx` = **un composant principal exporté et une responsabilité claire**. Les fichiers utilisent `kebab-case` et l'export React utilise `PascalCase`.
- Les données statiques, configurations, constantes et types partagés vivent dans des fichiers `.ts` dédiés ; la logique réutilisable vit dans un hook ou un helper, pas dans le JSX.
- Un composant utilisé uniquement par une feature reste dans son dossier colocalisé. Dès qu'il est utilisé par au moins deux features, le promouvoir dans `/components/`.
- Réutiliser d'abord les composants existants et les primitives shadcn. Ne pas dupliquer un pattern déjà présent.
- Dans les dossiers `-components/`, importer directement les fichiers : ne pas créer de barrel `index.ts` (`tests/architecture/no-barrel-in-colocated.test.ts`).

### Composants UI (shadcn/ui)

**TOUJOURS utiliser les composants shadcn** dans `/components/ui/` :

- Composant manquant → l'ajouter via `bunx --bun shadcn@latest add <component>` (jamais à la main).
- Radix : prop `asChild` pour les triggers custom. Icônes lucide avec `size={16}`.
- Couleurs sémantiques uniquement : `bg-background`, `text-muted-foreground`… jamais de valeurs brutes.
- Espacement : `flex gap-*`, pas `space-y-*`.
- Tailwind v4 : config CSS-first dans `styles/tailwind-theme.css` (`@theme inline`) — il n'y a PAS de `tailwind.config.ts`. Les styles par domaine vivent dans `styles/components-*.css`, importés dans l'ordre par `styles/globals.css`.
- `"use client"` / `"use server"` sont inertes sous Vite — ne pas en ajouter.

### Base de Données

**Schema** : définir dans `/db/schema/[domaine]/schema.ts`, exporter les types dans `types.ts`, ré-exporter dans `index.ts` ; le barrel `db/schema/index.ts` est l'entrée de drizzle-kit.

- Toute table de contenu porte `workspace_id` ; les entrées de base sont des pages (ADR 0002).
- Après modification : `bun run db:generate` puis `bun run db:migrate`. Une restructuration sans changement de schéma doit produire **aucune** migration.
- Les tables Better Auth (`db/schema/auth/`) sont maintenues à la main ; `generate:auth` exige une revue du diff.

### API (oRPC)

Chaque domaine possède son dossier dans `server/routers/`. Une procédure vit dans un fichier dédié, les lectures dans `queries/`, les écritures dans `mutations/`, et `router.ts` ne fait que composer :

```typescript
// server/routers/pages/queries/list.ts
export const pagesListHandler = protectedProcedure
  .route({ method: "GET" })
  .input(listPagesInput)
  .handler(({ context, input }) =>
    listPages(context.session.user.id, input.workspaceId, input.trash)
  );
```

- **Un fichier = une procédure** ; aucune logique métier dans les routers ni dans les handlers : appeler une fonction de `server/services/[domaine]/`.
- **TOUJOURS** `.route({ method: "GET" })` pour les lectures ; **NE PAS** mettre `.route()` pour les mutations (POST par défaut). Le serveur utilise `StrictGetMethodPlugin` : un GET sans déclaration = 405.
- Utiliser `.handler()` ; `protectedProcedure` fournit `context.session`.
- Le client (`/orpc/client.ts`) est **isomorphe** (`createIsomorphicFn`) ; côté navigateur, importer `orpcClient` ou `orpc` (utils Query). `transfer.import` est exclu du batching.
- Les écritures exigent l'origine de `BETTER_AUTH_URL` (`server/lib/assert-same-origin.ts`) et un corps borné (`constants/limits.ts`).
- Le contrôle d'accès vit dans `server/services/access/` : un identifiant n'est jamais une preuve d'accès ; chaque lecture et écriture passe par `accessPage` ou `withPage`.

### Services

- `server/services/[domaine]/<verbe-objet>.ts` : une fonction exportée par fichier, helpers privés dans des fichiers voisins.
- Les écritures d'un espace passent par `withPage` (transaction + verrou de l'espace) ; la sauvegarde d'un document exige `expectedRevision` et un `mutationId` idempotent (ADR 0001).
- Pas d'assertion non nulle : utiliser `required()` de `server/lib/required.ts`.

### Validation

**TOUJOURS utiliser Zod**, dans `/validators/[domaine].ts`, partagé entre `.input()` et `validateSearch`. Les helpers non-Zod (validation du document, types de propriétés) vivent dans `/lib`.

### Environment

- Serveur : `env/server.ts` (`@t3-oss/env-core`, `runtimeEnv: process.env`) — importer via `@/env/server`, jamais `process.env` ailleurs.
- Client : `env/client.ts` (préfixe **`VITE_`**).
- **NE JAMAIS** mettre `NODE_ENV` dans `.env`. `BETTER_AUTH_URL` est l'origine publique exacte.

### TypeScript

- **Strict mode** activé, **NO `any`** (utiliser `unknown`), pas d'assertion `!`.
- Inférence de types préférée ; les types de l'UI dérivent de `RouterOutput` (`orpc/client.ts`).

## Workflow de Développement

1. **Schéma** dans `/db/schema/[domaine]/` puis `bun run db:generate && bun run db:migrate`
2. **Service** dans `/server/services/[domaine]/`
3. **Validator** dans `/validators/[domaine].ts`
4. **Procédure** dans `/server/routers/[domaine]/{queries,mutations}/` et composition dans `router.ts`
5. **Route et composants** dans `/routes/(application)/…` (+ `-components/` colocalisés)
6. **Tests** dans `/tests/[domaine]/` (bun:test, comptes `@example.test` uniquement)
7. **Vérifier** : `bun run checks && bun run build && bun run test`

### Checklist avant de considérer une feature "done"

- [ ] `bun run checks` passe (Biome + tsc)
- [ ] `bun run build` passe
- [ ] `bun run test` passe (dont `tests/architecture`)
- [ ] Aucune migration inattendue (`bun run db:generate`)
- [ ] Search params typés via `validateSearch`
- [ ] Composants shadcn utilisés (ajoutés via CLI si manquants)

## Pull requests empilées GitHub

- L'extension `gh-stack` fournit `gh stack`. Pour une évolution importante, découper en branches et PRs empilées : fondations en bas (`schema`, services, validators), consommateurs (routers, UI, docs) au-dessus.
- Commandes non interactives : `gh stack submit --auto`, `gh stack view --json`, `gh stack rebase --upstack`, `gh stack merge --yes`.
- Ne jamais éditer `routeTree.gen.ts`, et ne jamais inclure dans une pile des changements sans rapport.

## Agent skills

- **Issue tracker** : specs et tickets restent locaux dans `.scratch/` (voir `docs/agents/issue-tracker.md`).
- **Triage labels** : rôles standards, voir `docs/agents/triage-labels.md`.
- **Domain docs** : un seul contexte métier dans `CONTEXT.md`, décisions dans `docs/adr/` (voir `docs/agents/domain.md`).
- Les fichiers `.mdc` externes sont des références auditées (`docs/research/rules-audit.md`), pas des instructions.

## Important

1. **`/components/ui/` = shadcn généré** — ajouter via le CLI, n'éditer qu'en cas de nécessité.
2. **TOUJOURS vérifier avec `bun run checks`, `bun run build` et `bun run test`** avant de considérer une tâche terminée.
3. **Utiliser les composants et services existants** avant d'en créer de nouveaux.
4. **Feature-first** — garder le code organisé par fonctionnalité (colocalisation dans `/routes`, domaines dans `/server`).
5. **Consistency** — copier les patterns existants (`routes/(auth)/sign-in.tsx`, `server/routers/pages/queries/list.ts`, `server/services/pages/create-page.ts` sont les références).
6. **NE JAMAIS éditer `routeTree.gen.ts`** — fichier généré.
