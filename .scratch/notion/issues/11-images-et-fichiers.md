# 11 : Ajouter une cover, une image et une pièce jointe

**What to build:** Un utilisateur enrichit ses pages avec des fichiers qui restent privés.

**Blocked by:** 05, 07

**Status:** in-progress

## Critères d'acceptation

- [ ] Upload et rattachement asset/page autorisés, limites taille/MIME, erreurs et progression accessibles.
- [ ] Cover repositionnable et nœuds image/fichier persistés ; URLs externes non exécutables.
- [ ] Stockage local et interface S3 compatible ; accès privé ou URLs signées courtes contrôlées.
- [ ] Fichiers orphelins nettoyables, aucun fetch URL arbitraire côté serveur ; tests accès croisé et fichier invalide.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
