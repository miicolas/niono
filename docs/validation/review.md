# Revue de suivi

## Standards

- **P1 — Import profond** : une liste de pages déjà ordonnée pouvait dépasser 30 niveaux malgré la boucle bornée. Correction : valider chaque chemin avant toute insertion et refuser une ascendance sans racine lors de l’autorisation. Test d’archive profonde et de lecture d’une ancienne chaîne malformée.
- **P1 — Abandon du brouillon retrouvé** : « Ignorer » pouvait effacer une saisie plus récente. Correction : distinguer `ignoreRecovered` de l’abandon explicite de l’édition ; test IndexedDB de non-perte.
- **P2 — Audience de déplacement** : un booléen ne liait pas la confirmation aux bénéficiaires affichés. Correction : comparer IDs et droits confirmés avec l’audience recalculée sous verrou. Test de refus d’une audience différente.
- **P2 — Archive sans fichiers** : les IDs de fichiers omis rendaient le réimport impossible. Correction : export de valeurs vides avec avertissement ; les archives incluant les assets vérifient leur rattachement à l’entrée.

## Spec

- **P1 — Métadonnées après déplacement** : révision locale obsolète pouvant bloquer renommage et navigation. Correction : invalider la page déplacée et réconcilier seulement ses métadonnées, en préservant le document et le titre encore en cours de saisie.
- **P2 — Conflit sur carte** : le rafraîchissement ciblait la requête de table au lieu des colonnes. Correction : invalider toutes les requêtes d’entrées de la base après conflit.
- **P2 — Duplication pendant debounce** : la copie pouvait omettre la dernière saisie. Correction : exiger la fin de sauvegarde de la page ouverte avant duplication ; un conflit bloque cette opération. Une sous-page de secours est disponible pour conserver le brouillon en héritant des permissions de sa page d’origine.

Revue : quatre constats standards et trois constats de conformité corrigés. Les extensions et validations restant ouvertes figurent dans le rapport de livraison ; cette revue ne certifie pas la parité complète du produit.
