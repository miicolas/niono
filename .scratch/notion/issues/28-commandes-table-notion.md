# 28 — Commandes de table et gestion des colonnes

Status: done
Blocked by: aucun

Demande : manipuler les tables directement comme dans Notion.

- Menus d’en-tête : tris croissant/décroissant, filtre, renommage, masquage, déplacement et suppression confirmée.
- Réordonner les colonnes par glisser-déposer ou commandes clavier, ajuster leur largeur.
- Barre visible Filtrer / Trier / Propriétés : conditions ET/OU, opérateurs et valeurs adaptés au type, tris multiples ordonnés, visibilité des propriétés.
- Sauvegarde explicite des réglages, rechargement et rétrocompatibilité des vues existantes.
- Suppression atomique des valeurs et références dans toutes les vues ; droits, source et concurrence vérifiés au serveur. Le titre reste disponible.
- Vérifier tris avant pagination, filtres typés et valeurs vides, suppression et vues obsolètes, duplication/import, lecture seule et parcours navigateur.

Validation : `pnpm typecheck`, 26 tests réussis et build de production. Parcours Chromium et contrôle mobile documentés dans `docs/validation/database-controls.md`.
