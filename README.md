# DigiPM

Un espace de travail open source pour écrire et organiser ses projets, avec TanStack, PostgreSQL et Tiptap. Interface française sombre, thème papier, navigation issue du bloc shadcn **sidebar-10**. Authentification Better Auth par email et mot de passe, emails envoyés par Resend, sans temps réel.

**Version de développement fonctionnelle. La parité complète avec Notion reste en cours.** Voir [l’état de livraison et ses limites](docs/validation/delivery.md), plutôt que d’interpréter le plan initial comme une liste de fonctions déjà terminées.

## Démarrage local

Prérequis : Node 24, pnpm 10.30.1, Docker Compose.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

Dans `.env`, remplacez `POSTGRES_PASSWORD` (également dans `DATABASE_URL`) et `BETTER_AUTH_SECRET` par des secrets aléatoires. `openssl rand -hex 32` convient pour chaque valeur. Configurez `ASSET_DIR` avec un chemin **absolu** vers `.data/assets` du projet.

```sh
docker compose up -d
pnpm db:migrate
pnpm dev
```

Ouvrez l’adresse affichée par Vite, normalement [localhost:3000](http://localhost:3000), et créez un compte. Si le port est occupé, utilisez le port choisi par Vite dans `BETTER_AUTH_URL` puis redémarrez `pnpm dev`. Sans `RESEND_API_KEY`, les emails locaux sont écrits en JSON dans `.data/outbox` et le lien à ouvrir apparaît dans la console.

Pour créer un atelier de démonstration, définissez `DEMO_PASSWORD` dans `.env`, puis lancez `pnpm db:seed`. Le compte `atelier@digipm.test` reçoit des pages et une base d’exemple. Le seed est facultatif et ne crée pas de compte de démonstration en production.

## Fonctionnement

- Pages imbriquées, favoris, récents personnels, recherche, partage privé, invitations, rôles, corbeille, duplication et historique.
- Éditeur Tiptap : commandes `/`, barre contextuelle, tâches, listes, toggles, callouts, code, tables simples, liens, images et pièces jointes ; déplacement de blocs et annulation.
- Sauvegarde sérialisée, révisions atomiques, retries idempotents, brouillons IndexedDB et résolution explicite des conflits.
- Entrées de base ouvrables comme pages ; table virtualisée, tableau par statut paginé par colonne, liste, galerie et calendrier filtré par mois. Propriétés typées, filtres et vues enregistrées.
- Import Markdown/CSV avec aperçu, export Markdown/JSON/CSV et archive de sous-arbre avec fichiers, réimportable avec remappage des identifiants.
- Profil, changement et récupération du mot de passe ; emails de reset, de vérification et d’invitation envoyés par Resend.

Le bouton IA propose une sélection et une prévisualisation. Il nécessite `AI_MODEL` avec, au choix, `AI_GATEWAY_API_KEY` (Vercel AI Gateway) ou `AI_BASE_URL` et `AI_API_KEY` (service compatible OpenAI). Sans fournisseur, le panneau explique son indisponibilité. Le modèle payant « Notion-like editor » de Tiptap n’est pas inclus ; l’éditeur utilise les extensions open source et des composants propres au projet.

## Vérifications

```sh
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
SMOKE_URL=http://localhost:3000 pnpm exec tsx scripts/smoke-http.ts
SMOKE_URL=http://localhost:3000 pnpm exec tsx scripts/smoke-auth.ts
pnpm exec dotenv -e .env -- tsx scripts/benchmark.ts
```

Les tests d’intégration utilisent PostgreSQL et créent uniquement des comptes synthétiques `@example.test`. Le benchmark génère temporairement 100 000 entrées et 2 millions de valeurs puis les supprime ; prévoyez de l’espace disque et exécutez-le hors trafic réel. Les mesures disponibles et les essais navigateur sont consignés dans [validation](docs/validation/delivery.md).

## Auto-hébergement

Voir [le guide d’exploitation](docs/operations.md) pour Docker, Resend, sauvegarde et restauration. L’image utilise Node 24 et fonctionne sans root. Les migrations s’exécutent dans un service distinct avant le démarrage de l’application.

## Architecture et contribution

Monorepo pnpm : `apps/web` pour TanStack Start, `packages/server` pour les modules métier et oRPC, `packages/db` pour Drizzle, `packages/contracts` pour Zod et `packages/editor` pour Tiptap. Query détient les données serveur ; Zustand gère l’interface ; Tiptap détient le document en cours de saisie.

Le [plan](docs/implementation-plan.md), les [ADR](docs/adr/), le [glossaire](CONTEXT.md) et le [backlog](.scratch/notion/README.md) documentent les choix et les travaux restants. Les [références design](docs/design/notion-reference.md) incluent Notion, Mobbin et les liens Tiptap demandés.

Les 37 skills de `mattpocock/skills` ont été installés pour Codex via `npx skills@latest add mattpocock/skills --agent codex --skill '*' --yes`. Leur provenance figure dans `skills-lock.json` ; les workflows pertinents sont appliqués selon la tâche.

## Licence

Code DigiPM : **AGPL-3.0-or-later**, voir [LICENSE](LICENSE). Les composants et dépendances tiers conservent leurs licences, voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). DigiPM est un projet indépendant, sans affiliation à Notion ou Tiptap.
