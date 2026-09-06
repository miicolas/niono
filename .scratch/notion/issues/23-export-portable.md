# 23 : Exporter pages et bases dans des formats portables

**What to build:** Un utilisateur récupère ses contenus dans un export portable.

**Blocked by:** 12, 15, 19

**Status:** in-progress

## Critères d'acceptation

- [ ] Markdown et JSON versionné pour les pages ; CSV pour les bases ; fichiers et manifest de liens inclus selon option.
- [ ] Export borné en V1 avec erreur claire au dépassement ; droits appliqués à chaque contenu et fichier.
- [ ] Formules CSV potentiellement exécutables neutralisées selon mode d'export documenté.
- [ ] Tests arborescence, caractères Unicode, propriétés multiples et contenu interdit absent.


## État constaté

Implémentation et vérifications décrites dans [le rapport de livraison](../../../docs/validation/delivery.md). Les critères non cochés restent à vérifier ou à compléter ; la présence du code ne vaut pas validation de tous les cas.
