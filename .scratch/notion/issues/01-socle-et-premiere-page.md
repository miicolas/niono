# 01 : Créer un compte et ouvrir une première page dans sidebar-10

**What to build:** Un utilisateur installe le socle, crée un compte et voit sa première page persistée dans un espace réel, depuis la sidebar demandée.

**Blocked by:** None (can start immediately)

**Status:** done

## Critères d'acceptation

- [x] TanStack Start, oRPC, Query, Better Auth email/mot de passe, Drizzle et PostgreSQL compilent ensemble avec des versions verrouillées et des peerDependencies cohérentes.
- [x] La commande npx shadcn@latest add sidebar-10 est exécutée après configuration TanStack/shadcn ; le layout et les Link sont adaptés ; aucun runtime Next n'est ajouté.
- [x] Inscription, connexion et déconnexion utilisent Better Auth ; création du workspace et de sa première page idempotente à la reprise.
- [x] La sidebar conserve les primitives sidebar-10, présente le workspace réel et la page avec son titre, et aucun lien # ou menu de démonstration inactif.
- [x] Rechargement et accès direct fonctionnent ; un visiteur est redirigé ; deux comptes sont isolés ; tests d'intégration DB et smoke Playwright passent.
- [x] Build navigateur sans dépendances serveur, migration reproductible, README de démarrage local ; aucun temps réel activé.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
