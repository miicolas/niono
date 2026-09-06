# 10 : Consulter et restaurer une version de document

**What to build:** Un éditeur restaure un état antérieur sans perdre l'état actuel.

**Blocked by:** 04, 09

**Status:** in-progress

## Critères d'acceptation

- [ ] Checkpoints de contenu selon la politique du plan ; liste paginée avec auteur/date et aperçu.
- [ ] Restauration crée une nouvelle révision avec contrôle de conflit et snapshot préalable.
- [ ] Accès à l'historique exige le même droit que la page ; rétention configurable et nettoyage borné.
- [ ] Tests restauration concurrente, page supprimée et version non autorisée.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
