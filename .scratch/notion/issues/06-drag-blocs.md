# 06 : Déplacer les blocs de texte en conservant sélection et undo

**What to build:** Un utilisateur réorganise le texte par une poignée et annule son déplacement.

**Blocked by:** 05

**Status:** in-progress

## Critères d'acceptation

- [ ] DragHandle Tiptap React validé sur la version installée ; aucun provider de collaboration ni WebSocket ; fallback ProseMirror si nécessaire.
- [ ] Déplacement avant/après et niveaux pris en charge ne duplique ni ne perd du contenu ; IDs stables.
- [ ] Un drop correspond à une opération undo cohérente ; sélection de texte ordinaire n'active pas le drag.
- [ ] Déplacement au clavier ou menu accessible, auto-scroll et indication de destination ; scénarios desktop/touch testés.
- [ ] Déplacements sauvegardés puis rechargés et tests navigateur sur listes imbriquées.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
