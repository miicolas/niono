# Validation des graphiques — 6 septembre 2026

Les bases disposent d’une vue Graphique construite avec `@tanstack/charts` 0.16.0. Les réglages utilisent un Popover shadcn compact, près du graphique : quatre aperçus de type, choix alignés, palette de cinq couleurs et légende sur une ligne. Les modifications se reflètent immédiatement ; « Enregistrer la vue » persiste les réglages avec contrôle de révision.

## Comportements couverts

- Barres verticales, barres horizontales, courbe et anneau.
- Catégories texte, nombre, case à cocher, sélection/statut, date, URL et email ; regroupement des dates par jour, semaine, mois ou année.
- Nombre de pages, somme, moyenne, minimum et maximum ; les valeurs numériques absentes restent distinctes de zéro. L’anneau explique les répartitions impossibles (valeurs négatives ou total nul).
- Agrégation SQL de toutes les entrées accessibles après les filtres ET/OU et la recherche ; le détail d’une catégorie partage le même prédicat d’accès et de filtrage.
- Infobulles et accès aux pages au clic ou au clavier. Une table TanStack Table/shadcn repliable présente les valeurs exactes, y compris celles sans valeur numérique.
- Réglages conservés en duplication/import, références réparées après suppression de propriété, conflits d’enregistrement détectés.
- Export SVG avec titre, couleurs, catégories et valeurs.

Le serveur retourne au plus 200 catégories et les totaux complets. Au-delà, l’interface demande d’affiner les filtres et explique que la table présente les 200 premières catégories ; elle ne dessine pas une répartition tronquée. Les propriétés à valeurs multiples ne sont pas proposées pour le regroupement dans ce lot.

## Parcours navigateur

Compte et contenu synthétiques locaux : six projets, trois statuts, une propriété Budget et une Échéance.

- Création d’une vue Graphique depuis le sélecteur de dispositions ; trois groupes de deux pages.
- Somme de Budget par statut : 4 800, 3 000 et 5 700 ; total de l’anneau 13 500. Ouverture de la légende « En cours » : les deux pages attendues.
- Passage à la courbe violette et au regroupement mensuel par Échéance : septembre 8 300 et octobre 5 200. Masquage de la légende, sauvegarde et rechargement : réglages conservés.
- Flèche droite puis Entrée sur le graphique : ouverture des trois pages de septembre, avec les intitulés attendus.
- Menu à 390 px et 320 px : aucun débordement horizontal ; à 320 px, le panneau mesure 296 px et conserve une marge de 12 px. La taille de la fenêtre a ensuite été restaurée.
- Export déclenché depuis l’interface, fichier SVG téléchargé puis analysé comme XML : dimensions valides, titre, couleurs et valeurs présentes, aucun `NaN`.

Captures : [menu desktop](screenshots/chart-settings-desktop.png), [menu mobile](screenshots/chart-settings-mobile.png), [export SVG](screenshots/chart-export.svg). Le panneau desktop mesure 352 × 333 px pour le calcul par statut et affiche tous les réglages sans défilement interne.

## Contrôles automatisés

`tests/charts.test.ts` et `tests/charts-persistence.test.ts` : 8 tests réussis sur PostgreSQL réel. Cas : source de plus de 50 entrées, droits de lecture/écriture, pages privées et corbeille, agrégations/null/zéro/négatifs, filtres ET/OU et recherche, détail de catégorie, dates, références incompatibles, limite de 200 catégories, persistance/conflit, duplication/import et suppression de propriété.

Contrôles finaux réussis :

- `pnpm exec dotenv -e .env -- vitest run tests/charts.test.ts tests/charts-persistence.test.ts tests/content.test.ts` : **28 tests**, dont les 20 tests existants des documents/bases, des filtres et des transferts.
- `pnpm typecheck` : contrôle de structure intégré (**777 fichiers**, ≤300 lignes, une fonction autonome par fichier), types des cinq packages et vérification des tests/scripts.
- `pnpm build` : build client et serveur de production. Les graphiques sont chargés dans un module séparé.

Les captures de largeur mobile vérifient le rendu responsive dans Chromium, pas les gestes sur un appareil tactile physique.
