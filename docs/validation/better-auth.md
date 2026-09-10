# Gestion des organisations par Better Auth

Validation du 6 septembre 2026, Better Auth et adaptateur Drizzle **1.7.3**.

Les espaces, membres, rôles, invitations et équipes utilisent le plugin Organization. Les écrans de paramètres, le sélecteur d’espace et la page d’invitation appellent le client Better Auth ; les suggestions de personnes lisent son endpoint de membres. Les anciennes procédures `workspace.create/members/invite/accept/role` et les mutations maison ont été supprimées. Le contenu conserve uniquement ses règles propres aux pages et consulte les appartenances Better Auth.

La migration `0005_better_auth_organizations` a été appliquée en local après sauvegarde. Un essai sur base vierge et un essai sur une restauration de cette sauvegarde ont confirmé la conservation de **372 espaces, 445 appartenances et 3 172 pages**, sans référence orpheline. Les identifiants, noms, icônes et rôles ont été comparés avant/après. Drizzle Kit ne détecte aucun écart entre le schéma et le snapshot de migration.

Les anciennes invitations non acceptées deviennent `canceled` et nécessitent un nouvel envoi. La base locale ne contenait aucune invitation encore valide avant migration. Les emails de test ont été envoyés au Mailpit local.

Contrôles automatisés :

- `pnpm exec dotenv -e .env -- vitest run tests/organization tests/workspace tests/content` : **34 tests réussis**. Onboarding concurrent, première page via HTTP Better Auth, protection du dernier propriétaire, permissions, identité et email vérifié des invités, expiration, annulation, refus du rejeu, équipes, isolation entre organisations et révocation immédiate des accès. L’invitation vers une équipe crée les deux appartenances et active les deux contextes de session. Un test vérifie aussi que l’API Better Auth attend le verrou de contenu avant de changer un membre.
- Parmi ces tests, `tests/organization-ui.test.ts` couvre quatre parcours : validation du formulaire, transmission du rôle et de l’identifiant d’appartenance, visibilité des actions selon Better Auth et création d’équipe avec ajout du créateur. Les caches des membres et des pages sont invalidés après mutation.
- `pnpm typecheck` et `pnpm build` : réussis.

Les formulaires utilisent TanStack Form et Zod via ActionForm, avec les contrôles shadcn. La composition d’une équipe se consulte uniquement quand Better Auth autorise cette lecture, donc après avoir rejoint l’équipe. Les changements de membres sont sérialisés avec les écritures de contenu par le verrou d’organisation.

Décision : [ADR 0005](../adr/0005-better-auth-organizations.md). Référence : [Organization](https://better-auth.com/docs/plugins/organization).
