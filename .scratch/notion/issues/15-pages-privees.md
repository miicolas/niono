# 15 : Maîtriser les pages privées et l'héritage des accès

**What to build:** Un éditeur limite l'audience d'une racine de pages et connaît l'effet d'un déplacement.

**Blocked by:** 14, 09, 10, 11, 13

**Status:** in-progress

## Critères d'acceptation

- [ ] Racine workspace/private et grants explicites ; descendants hérités sans exceptions imbriquées en V1.
- [ ] Page privée accessible uniquement aux personnes autorisées, sans lecture implicite par owner du workspace.
- [ ] Déplacement prévisualise la nouvelle audience et requiert une action explicite si la portée change.
- [ ] Contrôles centralisés dans chaque endpoint, recherche, assets, historique et export futur ; tests de matrice des droits.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
