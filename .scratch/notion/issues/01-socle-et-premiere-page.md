# 01 : Créer un compte et ouvrir une première page dans sidebar-10

**What to build:** Un utilisateur installe le socle, crée un compte et voit sa première page persistée dans un espace réel, depuis la sidebar demandée.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] TanStack Start, oRPC, Query, Better Auth email/mot de passe, Drizzle et PostgreSQL compilent ensemble avec des versions verrouillées et des peerDependencies cohérentes.
- [ ] La commande npx shadcn@latest add sidebar-10 est exécutée après configuration TanStack/shadcn ; le layout et les Link sont adaptés ; aucun runtime Next n'est ajouté.
- [ ] Inscription, connexion et déconnexion utilisent Better Auth ; création du workspace et de sa première page idempotente à la reprise.
- [ ] La sidebar conserve les primitives sidebar-10, présente le workspace réel et la page avec son titre, et aucun lien # ou menu de démonstration inactif.
- [ ] Rechargement et accès direct fonctionnent ; un visiteur est redirigé ; deux comptes sont isolés ; tests d'intégration DB et smoke Playwright passent.
- [ ] Build navigateur sans dépendances serveur, migration reproductible, README de démarrage local ; aucun temps réel activé.

