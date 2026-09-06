# 09 : Dupliquer et restaurer une arborescence

**What to build:** Un éditeur réutilise une structure et récupère une page supprimée.

**Blocked by:** 07, 05

**Status:** in-progress

## Critères d'acceptation

- [ ] Duplication profonde remappe pages/blocs et liens internes sans changer l'original ; transaction atomique et limite de volume.
- [ ] Corbeille avec date de suppression ; descendants inaccessibles via lien direct/recherche tant que l'ancêtre est supprimé.
- [ ] Restauration respecte les suppressions antérieures des descendants et choisit un emplacement valide si le parent a disparu.
- [ ] Suppression définitive bornée par rétention documentée et confirmation utilisateur ; tests des cas imbriqués.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
