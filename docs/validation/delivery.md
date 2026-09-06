# État de livraison — 6 septembre 2026

DigiPM est une application locale fonctionnelle, avec backend PostgreSQL et authentification réelle. **Ce n’est pas encore la V1 complète du plan initial, ni une parité complète avec Notion.** Le plan reste la cible ; ce rapport décrit les preuves disponibles.

## Stack effectivement installée

React 19.2.8, TanStack Start/Router/Query, Table 8.21.3 et Virtual, Vite 8, Nitro 3 bêta, Drizzle 0.45.2, PostgreSQL 17, oRPC 1.15.0, Better Auth 1.7.3, Tiptap 3.31.3, shadcn/Radix, Tailwind 4, Zustand, dnd-kit, RHF et Zod. Les manifestes et le lockfile fixent les versions. Node 24 est utilisé dans Docker ; les essais locaux ont tourné sous Node 25.8.0. Le runtime Nitro conserve une dépendance bêta : réévaluer son remplacement avant une release stable.

Le CLI shadcn `sidebar-10` a été exécuté puis ses primitives adaptées aux workspaces réels. Les 37 skills Matt Pocock sont installés ; grilling autonome, domain-modeling, codebase-design, TDD, implémentation et revue ont guidé le travail. Les références `.mdc` externes restent des documents audités. Aucun runtime Next.js, serveur temps réel ou service payant Tiptap n’a été ajouté.

## Preuves fonctionnelles

- `pnpm typecheck` : les cinq packages applicatifs, les tests et les scripts compilent ensemble.
- `pnpm test` : 21 tests passent, avec PostgreSQL réel et tests du hook de sauvegarde sur IndexedDB simulé. Ils couvrent isolation, lecture seule, accès privés hérités, CAS concurrent, reçu idempotent, filtrage typé, restauration, duplication/import, profondeur d’import, invitations, confirmation d’audience et brouillons.
- `scripts/smoke-http.ts` : inscription, session, isolation de deux comptes, sauvegarde/retry/conflit, base et cellule, export/réimport, fichier privé, origine refusée, méthode refusée et déconnexion.
- `scripts/smoke-auth.ts` : profil, contrôle de l’ancien mot de passe, changement, réception SMTP, reset, refus de réutilisation du jeton, révocation de session et connexion avec le nouveau mot de passe. Réponse de récupération neutre pour un compte inexistant.
- Build Vite/Nitro et image Docker réussis. Une installation Compose séparée a démarré sur une base vierge après migrations.
- Sauvegarde PostgreSQL + assets restaurée dans une autre base et un autre dossier ; présence de chaque fichier référencé vérifiée. La restauration ne remplace pas les données actives.

## Essais navigateur réalisés

Dans le navigateur intégré de Codex sur `localhost:3001` : connexion au compte de démonstration, création et renommage d’une page, commande `/titre` filtrée au clavier, insertion d’un titre 2, accents, saisie d’un paragraphe, statut « Enregistré » et contenu conservé après rechargement. Sélection, barre contextuelle, gras puis annulation vérifiés dans le DOM.

Déplacement physique d’un titre après un paragraphe, conservation de ses IDs, puis annulation en une opération vérifiés. Table éditable et tableau de projets ouverts ; drag d’une carte de « À faire » vers « En cours » confirmé par le statut enregistré et les comptes de colonnes. Calendrier consulté et mois filtré au serveur. Page et sidebar mobile inspectées à 390 × 844 ; viewport ensuite réinitialisé. Les thèmes sombre et papier ont été inspectés ; captures dans [screenshots](screenshots/). Le thème sombre suit la direction Tiptap demandée.

Le développement à chaud a provoqué des rechargements et un plantage d’aperçu pendant les changements de dépendances ; l’aperçu a été rouvert. Les dépendances React sont dédupliquées, les données vides de table stabilisées et les mutations artificielles à l’initialisation de l’éditeur supprimées. Ces observations ne constituent pas une validation Firefox/WebKit, tactile ou IME.

## Mesures de capacité

Voir [benchmark.json](benchmark.json). Jeu synthétique isolé : 10 000 pages, 100 000 entrées, 20 propriétés numériques et 2 000 000 de valeurs. 20 appels par opération après préchauffage, PostgreSQL Docker local ; mesures du module serveur, sans réseau simulé ni concurrence.

| Opération | p50 | p95 |
| --- | --- | --- |
| Première page de 50 entrées | 4 ms | 6 ms |
| Filtre numérique + 50 entrées | 18 ms | 22 ms |
| Recherche titre/contenu | 324 ms | 379 ms |

Le jeu a été supprimé après les mesures. Le contrôle a révélé un index manquant sur `pages.parent_id`, ajouté par migration. Ces résultats ne prouvent pas la latence de saisie d’un document de 1 000 blocs, le chargement sous réseau mobile ni la résistance à une charge concurrente.

## Écarts restant ouverts

| Domaine | Fonctionnel aujourd’hui | À terminer avant la V1 du plan |
| --- | --- | --- |
| Navigation | Arbre, menus de déplacement, favoris ordonnés, récents, recherche | Arbre virtualisé et pagination au-delà de 10 000 pages ; favoris par drag complet |
| Éditeur | Blocs courants, slash, sélection, drag/undo, sauvegarde | Matrice de collage Markdown/HTML, composition IME, listes imbriquées et drag tactile/hors écran sur plusieurs navigateurs ; coloration/langue du code |
| Conflits | Brouillon local, export, retry, rechargement et sous-page de secours | Comparaison visuelle de versions ; tests navigateur complets de coupure réseau et multi-onglets |
| Historique/corbeille | Snapshots, restauration et duplication profonde | Rétention configurable, purge définitive et collecte des fichiers orphelins |
| Propriétés | Texte, nombres, checkbox, options, statut, dates, personnes, URL/email, fichiers | Plages de dates, édition des définitions et conversion de type avec aperçu ; associations multiples normalisées avec contraintes relationnelles complètes |
| Vues | Table virtualisée, board paginé par colonne, liste, galerie, calendrier mensuel | Ordre/largeur de colonnes, tris multiples, ordre manuel des cartes et colonnes ; drag calendrier et liste des entrées sans date |
| Portabilité | Markdown/JSON/CSV et archive avec assets, import avec aperçu | Fidélité Markdown des tables/toggles ; imports volumineux par tâches de fond ; archive ZIP Notion |
| Livraison | Docker, migrations, scripts de sauvegarde/restauration, licence AGPL | CI multi-navigateurs, audit accessibilité complet, mesures frontend et procédures de restauration production répétées |

Pas de formules, relations/rollups, timeline, commentaires, publications publiques, Teamspaces, agents, applications natives ou synchronisation temps réel. Ces éléments restent dans les phases suivantes. Le panneau IA nécessite un fournisseur administrateur ; sa génération externe n’a pas été testée sans configuration.

Les entrées multiples sont actuellement stockées en JSONB validé côté serveur, et non dans toutes les tables d’association proposées par le plan. La pagination utilise des offsets bornés avec un ordre total, pas des curseurs. Le document d’architecture conserve ces écarts comme travaux explicites, sans annoncer une scalabilité illimitée.

## Revue

La revue des standards a entraîné des corrections sur la confidentialité de restauration, la profondeur des imports, les brouillons, les confirmations d’audience et les archives sans fichiers. La revue de conformité a entraîné les corrections sur la pagination du board/calendrier, les filtres multiples, les favoris/récents, les métadonnées après déplacement, les conflits de statut et la duplication après saisie. Les écarts fonctionnels du tableau ci-dessus restent ouverts dans les tickets.

## Dernier contrôle Docker et restauration

L’image finale répond sur `localhost:3003` avec un healthcheck valide. Les deux scripts HTTP y passent ; le parcours métier complet prend 358 ms sur cette exécution locale. La sauvegarde finale a pris 648 ms, puis la restauration isolée 870 ms : 78 comptes synthétiques/démonstration, 1 071 pages (dont fixtures de tests de structure), 359 documents, 573 entrées et 35 fichiers vérifiés. Ces nombres décrivent uniquement l’environnement de test.
