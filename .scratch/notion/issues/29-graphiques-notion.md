# 29 — Vues graphiques de bases

Status: done
Blocked by: aucun

Demande : créer des graphiques comme dans Notion avec TanStack Charts, puis remplacer le grand formulaire de réglages par un menu compact.

- Créer une vue Graphique depuis une base ; disposer de barres verticales/horizontales, courbes et anneaux.
- Choisir catégorie, intervalle de dates, nombre de pages ou somme/moyenne/minimum/maximum d’une propriété numérique, ordre, couleur et légende.
- Agréger toute la source autorisée après filtres/recherche ; exclure corbeille et pages privées inaccessibles. Conserver les valeurs nulles, zéro et négatives selon le calcul.
- Ouvrir les pages d’une catégorie depuis le graphique, au clavier ou depuis la table de valeurs ; conserver les filtres et la pagination du détail.
- Enregistrer/recharger les réglages, contrôler les révisions et remapper les propriétés en duplication/import ; réparer les références lors d’une suppression de propriété.
- Utiliser un Popover shadcn ancré au bouton de configuration, avec types en aperçu, lignes alignées et pastilles de couleur ; rester utilisable dès 320 px.
- Exporter un SVG autonome avec titre, couleurs et valeurs. Afficher explicitement les états sans données, sans valeurs numériques et les répartitions incompatibles avec un anneau.
- Au-delà de 200 catégories, afficher la limite et les totaux complets sans présenter un graphique partiel.

Validation : `pnpm typecheck` (incluant `check:structure`), 28 tests des graphiques et des bases réussis, build de production et parcours navigateur desktop/320–390 px. Détails et captures : `docs/validation/charts.md`.
