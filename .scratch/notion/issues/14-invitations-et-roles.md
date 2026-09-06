# 14 : Partager un espace avec des rôles asynchrones

**What to build:** Un propriétaire invite un membre lecteur ou éditeur, sans édition temps réel.

**Blocked by:** 02, 07

**Status:** in-progress

## Critères d'acceptation

- [ ] Invitation email bornée, expirante et idempotente ; acceptation liée à l'adresse vérifiée.
- [ ] Rôles owner/editor/viewer contrôlés sur les opérations métier existantes, fichiers et recherche.
- [ ] Retrait et changement de rôle prennent effet côté serveur ; gestion du dernier propriétaire cohérente.
- [ ] UI de membres et lecture seule ; tests invitations rejouées, viewer tentant une mutation et membre révoqué.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
