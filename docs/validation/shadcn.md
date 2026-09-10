# Audit shadcn, TanStack Table et TanStack Form

Validation du 6 septembre 2026. La demande couvre l’interface complète, avec TanStack pour les tableaux et formulaires, et Zod pour la validation.

## Composition retenue

| Usage | Implémentation |
| --- | --- |
| Libellés et erreurs | Label, Field, FieldLabel, FieldError, FormInput |
| Formulaires | TanStack Form 1.33.5, Zod 4.5.4, composants shadcn ; ActionForm pour les actions simples |
| Connexion, récupération, profil, mot de passe | Champs contrôlés TanStack, validation Zod, erreurs associées aux champs |
| Espaces, vues, propriétés, partage, icône, organisations | ActionForm avec schéma Zod et soumission asynchrone |
| Filtres de base et composeur Codex | État TanStack Form ; validation Zod avant soumission |
| Table de base | TanStack Table 8.21.3, composants Table, redimensionnement et virtualisation existants |
| Aperçu CSV et tableaux Markdown Codex | DataTable : TanStack Table et composants Table |
| Actions et métadonnées | Button, Badge, Avatar, Card, InputGroup, Spinner, Alert, Empty |
| Navigation | Sidebar shadcn conservée ; Breadcrumb et Tabs pour le fil d’Ariane et les vues |
| Menus de l’éditeur | Command pour `/`, DropdownMenu pour les blocs, Popover pour lien et couleurs |
| Formatage et questionnaire | Toggle et ToggleGroup ; primitives Questionnaire déjà présentes conservées |

Les composants ajoutés proviennent du registre officiel `new-york-v4`, avec adaptation des imports et textes français. Les façades publiques des composants sont conservées malgré leur découpage parallèle en petits fichiers.

L’éditeur reçoit les composants via `EditorUI`, ce qui évite une dépendance du package editor vers l’application web. Le contenu Tiptap (tables de document, paragraphes, listes, détails) garde son schéma et sa sérialisation. Les poignées de redimensionnement de colonnes appartiennent à TanStack Table ; elles ne sont pas des panneaux Resizable. Les primitives UI rendent nécessairement des éléments HTML natifs. L’audit JSX ne trouve plus de label, bouton, select, input, textarea, table ou fieldset natif dans les fonctionnalités applicatives et l’éditeur.

Les schémas Zod sont branchés sur `validators.onSubmit`. ActionForm applique également `schema.parse` à la valeur transmise à l’action, car TanStack valide les transformations sans appliquer leur résultat aux valeurs. `useFormSubmit` verrouille la phase de validation asynchrone pour empêcher deux soumissions rapides. Les dépendances React Hook Form et son resolver ont été retirées.

## Vérifications

- `pnpm typecheck` : tous les packages et les fichiers de vérification passent.
- `pnpm build` : build client et serveur réussi.
- 19 tests ciblés passent dans `tanstack-forms`, `shadcn-controls`, `shadcn-overlays`, `codex-ui`, `codex-message` et `questionnaire`. Le dernier ajustement du rôle radio de ToggleGroup est vérifié par une nouvelle exécution des quatre tests questionnaire.
- Couverture : erreurs Zod accessibles, confirmation de mot de passe, valeurs Select, normalisation des valeurs, double soumission, calendrier, Checkbox Tiptap et lecture seule, questionnaires, fermeture Échap/restauration du focus, réponse IA tardive et rendu Markdown sûr.
- Navigateur local : écran de connexion inspecté visuellement, libellés accessibles et erreurs de saisie vérifiés. Cette passe ne constitue pas une validation visuelle exhaustive de chaque écran authentifié.

## Sources officielles consultées

- [Inventaire shadcn](https://ui.shadcn.com/docs/components), [Label](https://ui.shadcn.com/docs/components/radix/label), [Field](https://ui.shadcn.com/docs/components/radix/field).
- [Intégration shadcn et TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form), [validation TanStack Form et Standard Schema](https://tanstack.com/form/latest/docs/framework/react/guides/validation).
- [TanStack Table](https://tanstack.com/table/latest), [documentation v8 correspondant à la version verrouillée](https://tanstack.com/table/v8/docs/introduction), [Table shadcn](https://ui.shadcn.com/docs/components/radix/table).
- [Command](https://ui.shadcn.com/docs/components/radix/command), [DropdownMenu](https://ui.shadcn.com/docs/components/radix/dropdown-menu), [Toggle](https://ui.shadcn.com/docs/components/radix/toggle), [ToggleGroup](https://ui.shadcn.com/docs/components/radix/toggle-group), [InputGroup](https://ui.shadcn.com/docs/components/radix/input-group), [Alert](https://ui.shadcn.com/docs/components/radix/alert), [Empty](https://ui.shadcn.com/docs/components/radix/empty).
