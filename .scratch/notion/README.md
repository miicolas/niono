# Backlog d'implémentation

La [spec V1](spec.md) et le [plan](../../docs/implementation-plan.md) définissent le périmètre. Chaque ticket est une tranche testable par un parcours réel. Le socle 01 est livré. Les autres tranches sont implémentées à des degrés divers et restent en cours de validation : voir [le rapport détaillé](../../docs/validation/delivery.md).

| Ticket | Livrable | Bloqué par |
| --- | --- | --- |
| [01](issues/01-socle-et-premiere-page.md) | Créer un compte et ouvrir une première page dans sidebar-10 | — |
| [02](issues/02-recuperation-compte.md) | Récupérer son compte et modifier son profil | 01 |
| [03](issues/03-document-tiptap.md) | Écrire et enregistrer un document Tiptap | 01 |
| [04](issues/04-conflits-et-brouillons.md) | Conserver les brouillons et résoudre les conflits de sauvegarde | 03 |
| [05](issues/05-commandes-et-blocs.md) | Structurer un document avec les commandes et blocs courants | 03, 04 |
| [06](issues/06-drag-blocs.md) | Déplacer les blocs de texte en conservant sélection et undo | 05 |
| [07](issues/07-arbre-de-pages.md) | Créer, imbriquer et déplacer ses pages | 01, 04 |
| [08](issues/08-favoris-et-recents.md) | Retrouver ses pages dans l'accueil et les favoris | 07 |
| [09](issues/09-corbeille-et-duplication.md) | Dupliquer et restaurer une arborescence | 07, 05 |
| [10](issues/10-historique.md) | Consulter et restaurer une version de document | 04, 09 |
| [11](issues/11-images-et-fichiers.md) | Ajouter une cover, une image et une pièce jointe | 05, 07 |
| [12](issues/12-code-et-table-simple.md) | Écrire du code et une table simple dans une page | 05 |
| [13](issues/13-recherche.md) | Rechercher des titres et du contenu | 05, 07, 09 |
| [14](issues/14-invitations-et-roles.md) | Partager un espace avec des rôles asynchrones | 02, 07 |
| [15](issues/15-pages-privees.md) | Maîtriser les pages privées et l'héritage des accès | 14, 09, 10, 11, 13 |
| [16](issues/16-base-et-entrees.md) | Créer une base et ouvrir ses entrées comme pages | 07, 05, 15 |
| [17](issues/17-proprietes-scalaires.md) | Ajouter et éditer des propriétés typées | 16 |
| [18](issues/18-proprietes-multiples.md) | Associer options, personnes et fichiers aux entrées | 17, 11, 14 |
| [19](issues/19-vues-filtres-et-tris.md) | Enregistrer et partager les réglages d'une vue | 17, 18 |
| [20](issues/20-board.md) | Déplacer des entrées entre colonnes de board | 19 |
| [21](issues/21-liste-et-galerie.md) | Consulter une source en liste ou galerie | 19, 11 |
| [22](issues/22-calendrier.md) | Consulter et déplacer les entrées datées | 19 |
| [23](issues/23-export-portable.md) | Exporter pages et bases dans des formats portables | 12, 15, 19 |
| [24](issues/24-import-markdown-csv.md) | Importer Markdown et CSV avec un rapport de conversion | 23 |
| [25](issues/25-polish-et-accessibilite.md) | Valider le design papier et l'usage clavier/mobile | 06, 08, 10, 12, 15, 20, 21, 22, 24 |
| [26](issues/26-performance-et-restauration.md) | Prouver la fiabilité et la capacité du socle | 25 |
| [27](issues/27-release-autohebergee.md) | Livrer une V1 reproductible et documentée | 26 |

## Exécution

Le ticket 01 est terminé. Continuer les critères encore ouverts dans les tranches suivantes. `ready-for-agent` indique que la spécification est prête, pas que ses dépendances le sont. Le calendrier a son propre ticket et peut être reporté explicitement à la phase 2 ; tant que ce report n'est pas acté, 22 reste un prérequis de la release planifiée.

Les workflows TDD et diagnosing-bugs s'appliquent aux invariants risqués et anomalies ; code-review contrôle chaque tranche avant intégration. La granularité est réévaluée si un ticket dépasse une session de travail ; découper son comportement en sous-parcours en conservant ses critères.

## Extensions de parité à détailler après V1

Ces ensembles ont le statut `needs-triage`, pas celui de tickets déjà prêts à coder :

- **P2-A — Édition avancée** : colonnes, maths, table des matières, embeds, boutons, blocs synchronisés ; dépend de l'éditeur fiable et des permissions.
- **P2-B — Bases avancées** : relations, rollups, formules bornées, timeline, agrégats, vues liées, modèles ; dépend des propriétés et du moteur de filtres.
- **P2-C — Collaboration asynchrone** : commentaires ancrés, mentions et notifications rechargées ; dépend des IDs de blocs et des permissions.
- **P2-D — Publication et portabilité Notion** : pages publiques révocables, import ZIP avec manifeste des pertes, API et webhooks ; dépend de l'autorisation et des exports.
- **P2-E — Administration** : audit, quotas, rétention, Teamspaces et wiki ; dépend des permissions.
- **P3 — Écosystème** : formulaires/charts/dashboard/feed/map, multisource, automatisations, IA/agents, marketplace, apps natives et offline complet. Chaque famille exige sa spec et ses tests avant engagement.

Le temps réel reste exclu et nécessitera une décision utilisateur distincte. Les applications Mail et Calendar sont des chantiers séparés, pas une condition implicite de V1.

