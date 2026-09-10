# Commandes des tables — 6 septembre 2026

Les bases possèdent désormais une barre Filtrer / Trier / Propriétés et des menus sur les en-têtes. La disposition s’inspire des [contrôles de vues Notion](https://www.notion.com/help/views-filters-and-sorts).

- Tris multiples ordonnés, croissants ou décroissants, exécutés au serveur avant pagination ; indicateurs de priorité sur les en-têtes.
- Filtres ET/OU, opérateurs selon le type, sélecteurs de statut/options/personnes, valeurs numériques et dates. Les conditions sont appliquées ensemble pour éviter des requêtes invalides pendant la saisie. Affichage explicite si aucun résultat.
- Ajout, renommage, masquage et réaffichage des propriétés. Déplacement par poignée dnd-kit ou commandes de menu/liste ; largeur à la souris, au tactile ou au clavier.
- Sauvegarde explicite des réglages dans la vue avec révision ; anciennes configurations normalisées à la lecture. Ordre, largeurs et tris remappés lors de duplication/import.
- Suppression confirmée d’une propriété : valeurs supprimées par cascade et références nettoyées dans toutes les vues, au sein de la même transaction. Les pages subsistent. Le titre ne peut être masqué ni supprimé.

## Vérification

`pnpm typecheck`, `pnpm test` (26 tests, dont 5 nouveaux tests métier) et `pnpm build` passent. Le build conserve son avertissement de taille des bundles supérieurs à 500 ko.

Les nouveaux tests couvrent les tris multiples avant pagination, ET/OU, les opérateurs incompatibles, valeurs numériques invalides, tableaux vides/absents, caractères `%` littéraux, nettoyage des vues et valeurs après suppression, droits viewer/editor, source incorrecte, renommages concurrents, sauvegarde, duplication et import.

Parcours Chromium dans le navigateur intégré, instance locale port 3001 : tri décroissant, filtre Statut = En cours (2 pages sur 4), déplacement par menu et glisser-déposer, masquage/réaffichage, largeur au clavier, ajout et renommage d’une propriété, sauvegarde de deux tris et rechargement conservant ordre et largeur. Dialogue de suppression vérifié puis annulé ; suppression effective couverte par les tests PostgreSQL. État vide numérique vérifié. Aucun message d’erreur dans la console pendant ces parcours. Les écritures de validation utilisent une base dédiée, placée ensuite dans la corbeille.

Rendu du panneau de filtres inspecté à 390 × 844 et du tableau sur desktop. La transition menu → filtre/dialogue conserve le focus dans le nouveau panneau.

## Bornes

Filtres plats ET/OU (20 conditions maximum), 20 tris maximum ; groupes imbriqués non inclus. Les réglages temporaires restent locaux jusqu’à « Enregistrer la vue ». Les propriétés gardent leur type ; la conversion de type et l’édition des options ne font pas partie de cette tranche. Les tests navigateur ne couvrent pas Firefox/WebKit ni un appareil tactile réel.
