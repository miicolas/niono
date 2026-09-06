# DigiPM

Plan de construction d'un espace de travail open source type Notion, avec une direction visuelle papier et la navigation shadcn **sidebar-10**.

**État actuel : documentation et skills prêts ; application à implémenter.** Aucun serveur, migration, formulaire Better Auth ou éditeur fonctionnel n'est encore livré.

- [Plan d'implémentation](docs/implementation-plan.md) : architecture, données, parité, sécurité et critères de livraison.
- [Spec et tickets](.scratch/notion/README.md) : tranches exécutables et dépendances.
- [Design Notion / Mobbin et sidebar-10](docs/design/notion-reference.md).
- [Grill autonome](docs/decisions/grill-autonome.md) : arbitrages et cas limites.
- [Audit des 17 règles](docs/research/rules-audit.md) et [sources techniques](docs/research/technical-sources.md).
- [Glossaire](CONTEXT.md) et [instructions du projet](AGENTS.md).

Stack retenue : TanStack Start/Router/Query/Table/Virtual, React, TypeScript, Drizzle, PostgreSQL, oRPC, Better Auth email/mot de passe, shadcn/ui, Tailwind, Zustand, Tiptap, dnd-kit, React Hook Form et Zod. **Pas de temps réel en V1.**

Les 37 skills de `mattpocock/skills` ont été installés pour Codex dans `.agents/skills/` avec :

```sh
npx skills@latest add mattpocock/skills --agent codex --skill '*' --yes
```

`skills-lock.json` conserve leur provenance. Les workflows pertinents sont appliqués selon les tâches ; leur présence n'impose pas de lancer ceux qui concernent d'autres besoins.

La commande `npx shadcn@latest add sidebar-10` est prévue au ticket 01, après configuration de l'application TanStack. Le registre officiel du bloc a été inspecté pour préparer son adaptation.
