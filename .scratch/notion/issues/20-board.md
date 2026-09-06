# 20 : Déplacer des entrées entre colonnes de board

**What to build:** Un éditeur change le statut d'une entrée en déplaçant sa carte.

**Blocked by:** 19

**Status:** in-progress

## Critères d'acceptation

- [ ] Board dnd-kit groupé par propriété supportée, y compris groupe sans valeur ; pagination par colonne.
- [ ] Drop modifie la propriété et l'ordre dans une transaction autorisée ; rollback et conflit de cellule traités.
- [ ] La carte ouvre la même page que la table ; invalidation ciblée des vues.
- [ ] Alternative clavier, annulation avant drop et auto-scroll ; tests concurrence et rechargement.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
