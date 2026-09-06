# Composants tiers

Le code original DigiPM est distribué sous AGPL-3.0-or-later. Les licences et avis des dépendances restent applicables à leur code ; ils sont présents dans les packages installés et ne sont pas remplacés par la licence du projet.

- Tiptap et ProseMirror : moteur et extensions open source sous MIT. Aucun template Tiptap Start/Team, extension IA propriétaire ou service de collaboration n’est redistribué.
- shadcn/ui et Radix : composants sous MIT, dont les primitives générées par le registre `sidebar-10`.
- TanStack, React, Zustand, Better Auth, Drizzle ORM, oRPC, Zod, dnd-kit, React Hook Form, Tailwind CSS, date-fns : licences fournies dans leurs distributions.
- Lucide : icônes sous ISC. La typographie utilise les polices disponibles sur le système ; aucun fichier de police commerciale n’est distribué.
- Les références Notion, Mobbin et Tiptap servent à étudier les interactions et la direction visuelle. Leurs logos, captures et sources commerciales ne font pas partie du produit redistribué.

Les versions exactes et la provenance de chaque dépendance sont verrouillées dans `pnpm-lock.yaml`. Pour générer l’inventaire des licences du graphe installé : `pnpm licenses list --json`.
