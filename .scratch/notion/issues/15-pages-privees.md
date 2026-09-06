# 15 : Maîtriser les pages privées et l'héritage des accès

**What to build:** Un éditeur limite l'audience d'une racine de pages et connaît l'effet d'un déplacement.

**Blocked by:** 14, 09, 10, 11, 13

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] Racine workspace/private et grants explicites ; descendants hérités sans exceptions imbriquées en V1.
- [ ] Page privée accessible uniquement aux personnes autorisées, sans lecture implicite par owner du workspace.
- [ ] Déplacement prévisualise la nouvelle audience et requiert une action explicite si la portée change.
- [ ] Contrôles centralisés dans chaque endpoint, recherche, assets, historique et export futur ; tests de matrice des droits.

