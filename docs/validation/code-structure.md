# Structure et performance — 6 septembre 2026

## Règles appliquées

Les règles durables sont dans [code-structure.md](../agents/code-structure.md), référencé par `AGENTS.md`. `pnpm typecheck` commence désormais par `pnpm check:structure`.

Le contrôle parcourt toutes les applications, tous les packages, les scripts, les tests et les configurations JavaScript/TypeScript de la racine. Il refuse plus de 300 lignes physiques ou plusieurs fonctions autonomes dans un fichier. Les composants `memo` et `forwardRef` sont aussi comptés. Les callbacks locaux et les méthodes d’une classe restent encapsulés. Les dépendances, sorties de build, fichiers générés et répertoires temporaires sont exclus.

Les grandes feuilles CSS ont été réparties par responsabilité, en conservant l’ordre des règles et des imports. Les fichiers historiques des composants, services et contrats restent des façades explicites ; leurs implémentations sont dans des modules dédiés. Les suites longues de tests sont réparties par comportement, avec des fixtures communes.

## Mutualisation et performance

- Les actions du questionnaire partagent le même composant, avec des props typées et des variants de présentation. La navigation des paramètres réutilise un même groupe d’onglets.
- Le répertoire des fichiers importés a un seul propriétaire ; les consommateurs réutilisent sa fonction de résolution.
- Les réponses de table indexent les valeurs par page en une seule passe, au lieu de filtrer toutes les valeurs pour chaque ligne. La construction passe de O(lignes × valeurs) à O(lignes + valeurs).
- Les colonnes visibles utilisent un index de propriétés et des ensembles pour la visibilité et l’ordre. Les résultats et callbacks React concernés sont stabilisés.
- L’éditeur partage son abonnement à l’état modifiable entre ses vues de nœuds. Les extensions et actions sont mémorisées ; la normalisation de recherche a une implémentation commune.

Le découpage des fichiers ne constitue pas, à lui seul, un gain de performance. La mesure ci-dessous concerne seulement la construction en mémoire des réponses de table, hors SQL, réseau et rendu React.

## Mesure reproductible

Commande : `pnpm exec tsx scripts/benchmark-property-values.ts`.

Jeu synthétique : 100 lignes, 100 propriétés par ligne, soit 10 000 valeurs. Chaque algorithme est échauffé 10 fois puis mesuré 30 fois ; l’égalité complète des résultats est vérifiée avant la mesure. L’ancienne implémentation reste uniquement dans le benchmark comme référence.

| Passage    | Médiane avant | Médiane après | Rapport |
| ---------- | ------------: | ------------: | ------: |
| Initial    |      8,743 ms |      0,293 ms |  29,84× |
| Répétition |      8,859 ms |      0,397 ms |  22,31× |

Résultats bruts : [initial](structure-performance.json), [répétition](structure-performance-repeat.json). Ces mesures locales varient avec la charge de la machine et ne décrivent pas la vitesse globale de l’application.

## Validation

- Un passage global après le refactoring a réussi : 112 tests dans 22 fichiers, TypeScript et build de production.
- Une vérification supplémentaire des documents, composants shadcn, formulaires, états d’interface et règles de structure a réussi : 40 tests dans six fichiers. Les scripts de contrôle et de benchmark passent aussi leur vérification TypeScript stricte.
- Un test déterministe couvre une course découverte dans les événements Codex : une lecture périmée d’une conversation en cours ne peut plus remplacer son état terminé par un échec. Ce test et les tests d’exécution Codex ont réussi après correction.
- Sur le build de production local : accueil, table de six entrées, recherche ramenant une entrée, masquage/restauration d’une colonne, paramètres, onglet d’import, document avec tâches et ouverture du panneau Codex. Aucun message d’erreur console pendant ces parcours. Les changements de vue temporaires ont été réinitialisés.

La tâche PM-OS modifie simultanément le moteur et l’interface Codex. Ses imports et son formatage sont encore en construction après le passage global ci-dessus ; la validation finale de cette intégration reste à effectuer dans cette tâche. Le contrôle de structure s’applique également à ses nouveaux modules.
