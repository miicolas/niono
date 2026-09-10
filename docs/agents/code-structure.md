# Structure du code

Chaque fichier maintenu de code, de styles et de tests contient au plus 300 lignes physiques, après formatage. Le contrôle `check:structure` couvre toutes les applications et tous les packages, les scripts, les tests et les configurations JavaScript/TypeScript à la racine. Les répertoires cachés temporaires, dépendances, sorties de build, données locales et fichiers générés par un outil (lockfile, migrations et snapshots, routes et protocole Codex) gardent leur format de génération.

Un fichier définit une seule fonction autonome, un hook, un composant ou une classe. Les callbacks qui capturent l’état local restent avec leur propriétaire ; les méthodes qui protègent l’état d’une classe restent ensemble. Les types et constantes nécessaires peuvent accompagner leur fonction. Un point d’entrée peut réexporter plusieurs fonctions, sans contenir leur implémentation.

Découper par responsabilité : accès aux données, commandes, cycle de vie, rendu et contrôle d’un formulaire. Préserver une interface publique courte et les invariants transactionnels. Les imports internes visent les implémentations directement pour éviter les dépendances circulaires entre façades.

Mutualiser les comportements identiques à leur propriétaire commun. Utiliser des props typées, des unions discriminées et des variants pour les différences de rendu réellement présentes. Les règles métier partagées ont une seule implémentation ; les cas particuliers restent explicites dans leurs paramètres.

Optimiser les chemins mesurables : requêtes bornées, invalidation ciblée, index de recherche en mémoire au lieu de scans répétés et abonnements React limités aux données utilisées. Déplacer une fonction dans un fichier ne constitue pas une amélioration de performance en soi.

Avant livraison : faire passer le contrôle de structure, TypeScript, les tests des interfaces publiques et le build. Une refonte du rendu se vérifie aussi sur les parcours concernés. Documenter les mesures quand un gain de performance est annoncé.
