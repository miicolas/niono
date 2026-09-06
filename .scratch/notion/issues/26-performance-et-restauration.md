# 26 : Prouver la fiabilité et la capacité du socle

**What to build:** Un opérateur peut mesurer les limites et restaurer les données du produit.

**Blocked by:** 25

**Status:** in-progress

## Critères d'acceptation

- [ ] Fixtures 1 000 blocs, 10 000 pages, 100 000 entrées/20 propriétés ; machine, réseau et résultats p95 documentés.
- [ ] Index et plans de requête inspectés ; budgets du plan atteints ou défauts bloquants corrigés.
- [ ] Tests tenant, rôles, conflits, assets, rendu hostile et retries exécutés dans la suite de release.
- [ ] Sauvegarde DB/assets et restauration sur environnement vide ; RPO/RTO mesurés.
- [ ] Logs structurés sans contenus sensibles et métriques de sauvegarde/conflit disponibles.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
