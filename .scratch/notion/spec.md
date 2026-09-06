# DigiPM — spécification V1

**Status:** ready-for-agent

## Problem Statement

L'utilisateur souhaite un espace de travail open source offrant l'expérience familière de Notion : écrire librement, déplacer les blocs, organiser des pages et exploiter des bases de données dans une interface sobre au caractère papier. La stack doit être TanStack, Drizzle, PostgreSQL, shadcn avec sidebar-10, oRPC, Zustand et Tiptap. L'authentification email/mot de passe Better Auth suffit ; le temps réel est exclu pour l'instant.

## Solution

Une application web responsive auto-hébergeable, avec un éditeur par blocs fiable, un arbre de pages, des vues de bases sur des entrées qui restent des pages, et une protection explicite contre les écrasements de saisie. Une matrice distingue V1 et extensions de parité. Les comptes, contenus et opérations sont persistés ; les écrans vides, erreurs et états de sauvegarde font partie du produit.

## User Stories

1. En tant qu'utilisateur, je veux créer un compte email/mot de passe afin de disposer d'un espace privé.
2. En tant qu'utilisateur, je veux me reconnecter et me déconnecter afin de contrôler ma session.
3. En tant qu'utilisateur, je veux récupérer mon accès par email afin de remplacer un mot de passe oublié.
4. En tant que propriétaire, je veux nommer mon espace et créer ma première page afin de commencer immédiatement.
5. En tant que membre, je veux basculer entre mes espaces afin de séparer mes contenus.
6. En tant que membre, je veux retrouver l'ergonomie sidebar-10 afin de naviguer sans apprentissage inutile.
7. En tant qu'éditeur, je veux créer, renommer et imbriquer mes pages afin d'organiser mes documents.
8. En tant qu'éditeur, je veux déplacer une page au drag ou au clavier afin de réorganiser son emplacement.
9. En tant qu'éditeur, je veux ajouter titre, icône et cover afin de reconnaître une page.
10. En tant qu'éditeur, je veux saisir des paragraphes, titres et listes afin de structurer mes idées.
11. En tant qu'éditeur, je veux des tâches, toggles, citations et callouts afin de varier la présentation.
12. En tant qu'éditeur, je veux insérer code, table simple, images et fichiers afin d'enrichir mes notes.
13. En tant qu'éditeur, je veux sélectionner des blocs avec `/` afin de garder les mains au clavier.
14. En tant qu'éditeur, je veux formater une sélection afin de préciser son sens.
15. En tant qu'éditeur, je veux déplacer, dupliquer et convertir un bloc afin de restructurer le document.
16. En tant qu'éditeur, je veux annuler et rétablir afin de corriger mes actions, y compris un déplacement.
17. En tant qu'éditeur, je veux voir le statut de sauvegarde afin de savoir si mes changements sont durables.
18. En tant qu'éditeur, je veux conserver mon brouillon après une erreur réseau afin de ne pas perdre ma saisie.
19. En tant qu'éditeur, je veux résoudre un conflit entre onglets afin qu'une modification n'en efface pas une autre.
20. En tant qu'éditeur, je veux consulter et restaurer une révision afin de récupérer un contenu antérieur.
21. En tant qu'éditeur, je veux dupliquer une arborescence afin de réutiliser sa structure.
22. En tant qu'éditeur, je veux mettre une page à la corbeille et la restaurer afin de pouvoir revenir sur une suppression.
23. En tant que membre, je veux ajouter des favoris et consulter mes récents afin de retrouver mon travail.
24. En tant que membre, je veux rechercher les titres et contenus auxquels j'ai accès afin de trouver une information.
25. En tant que propriétaire, je veux inviter un membre avec un rôle afin de partager mon espace de manière asynchrone.
26. En tant qu'éditeur, je veux distinguer les pages privées des pages partagées afin de maîtriser leur audience.
27. En tant que lecteur, je veux consulter le contenu autorisé sans pouvoir le modifier.
28. En tant qu'éditeur, je veux créer une base dont chaque entrée est une page afin de joindre notes et données.
29. En tant qu'éditeur, je veux définir des propriétés typées afin d'organiser les entrées.
30. En tant qu'éditeur, je veux modifier une cellule et ouvrir sa page afin de passer du tableau au détail.
31. En tant que membre, je veux filtrer et trier au serveur afin d'explorer une grande base.
32. En tant que membre, je veux enregistrer plusieurs vues afin de conserver des perspectives distinctes.
33. En tant qu'éditeur, je veux déplacer une carte de board afin de modifier son statut.
34. En tant que membre, je veux consulter les mêmes entrées en liste ou galerie afin de choisir une présentation adaptée.
35. En tant que membre, je veux voir mes entrées datées sur un calendrier afin d'organiser les échéances.
36. En tant qu'utilisateur, je veux exporter pages et bases dans des formats portables afin de conserver mes données.
37. En tant qu'utilisateur, je veux importer Markdown et CSV avec un rapport d'erreurs afin d'éviter de tout ressaisir.
38. En tant qu'utilisateur au clavier ou sur mobile, je veux accéder à toutes les actions sans hover ni drag obligatoire.
39. En tant qu'opérateur, je veux installer et restaurer l'application depuis sa documentation afin de l'auto-héberger.
40. En tant que mainteneur, je veux des contrats testés et des dépendances verrouillées afin de faire évoluer le produit.

## Implementation Decisions

- Monolithe modulaire TanStack Start ; transport métier oRPC ; endpoints Better Auth natifs.
- PostgreSQL et Drizzle avec migrations, contraintes par espace et transactions pour les opérations composites.
- Auth email/mot de passe, SMTP pour la récupération, isolation des sessions et permissions métier vérifiées au serveur.
- Document Tiptap JSON par page, identifiants de blocs stables et schéma versionné.
- Sauvegardes sérialisées, révision atomique, reçus idempotents et conflits conservant le brouillon.
- Données serveur dans Query, URL dans Router, document dans Tiptap, UI partagée dans Zustand ; état sidebar détenu par le provider shadcn.
- Sidebar-10 adaptée au routeur et aux données réelles ; style papier ; références visuelles Mobbin documentées.
- Drag Tiptap pour les blocs, dnd-kit pour l'arbre, les favoris et les vues de collection.
- Entrées de base partageant l'identité d'une page, propriétés typées, filtres AST validés et vues persistées.
- Fichiers privés, recherche filtrée par droits, exports bornés et restauration documentée.

## Testing Decisions

Le dépôt initial ne contient aucun test ni code applicatif. Construire les tests autour des opérations des modules et des parcours navigateur : une mutation métier traverse autorisation, transaction et persistance sans simuler l'ORM. Les intégrations PostgreSQL réelles couvrent concurrence, isolation et invariants. Les tests navigateur couvrent Tiptap, focus, clavier, drag, cookies et navigation.

Cas prioritaires : sauvegardes concurrentes, retry après ACK perdu, modification pendant requête, accès inter-workspace, refetch pendant saisie, cycles de pages, restauration, filtres typés et conversion de propriété, droits d'assets, reset expiré et responsive. Les captures confirment la disposition ; elles ne remplacent pas les assertions de comportement. Les fixtures de performance et les budgets sont explicitement documentés dans le plan.

## Out of Scope

Pour la V1 : temps réel, présence, CRDT, OAuth/SSO, applications natives, offline complet, IA et agents, automatisations, Mail/Calendar comme applications séparées, marketplace, multisource, formules/rollups avancés, commentaires et publication publique. Ces familles restent dans la feuille de route de parité. Le calendrier de base V1 est une vue des entrées datées, distincte d'une application calendrier externe.

## Further Notes

Toutes les décisions de cadrage sont prises selon la demande d'autonomie de l'utilisateur. Les règles `.mdc` fournies sont des références distinctes de sa demande ; les prescriptions Next/RSC et les exemples obsolètes sont adaptés. Les versions exactes et les performances ne seront déclarées validées qu'après le bootstrap et les tests de l'application.
