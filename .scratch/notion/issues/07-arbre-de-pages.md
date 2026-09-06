# 07 : Créer, imbriquer et déplacer ses pages

**What to build:** Un utilisateur organise son espace par sous-pages dans sidebar-10.

**Blocked by:** 01, 04

**Status:** in-progress

## Critères d'acceptation

- [ ] Création, renommage, icône et navigation typée alimentent l'arbre réel ; enfants chargés progressivement.
- [ ] dnd-kit et action Déplacer vers modifient le parent/ordre au serveur avec droits et FK de workspace.
- [ ] Déplacements sérialisés et contrôle de cycle y compris concurrence ; IDs externes à l'espace rejetés.
- [ ] Zustand stocke l'expansion UI sans recopier les pages ; SidebarProvider possède l'ouverture de sidebar.
- [ ] Tests arbre profond, destination invalide, clavier, rollback réseau et rechargement.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
