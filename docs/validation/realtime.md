# Validation du temps réel

Date : 9 septembre 2026. Implémentation active par défaut, migrations appliquées en développement. Décision : [ADR 0006](../adr/0006-realtime-collaboration.md).

## Comportement livré

Les documents Tiptap et leurs titres utilisent Yjs. Les saisies sont regroupées sur 25 ms et envoyées immédiatement, sans attendre de quitter le champ. Les changements concurrents sont fusionnés ; l’annulation de l’éditeur concerne les opérations locales. Les participants voient les présences, curseurs et sélections des autres sessions autorisées sur la page.

Les commits de pages, hiérarchie, corbeille, favoris, pages récentes, bases, propriétés, vues, fichiers, organisations, équipes et permissions déclenchent des notifications PostgreSQL. Les états personnels Codex/PM-OS utilisent le même mécanisme, filtré par propriétaire. Un flux SSE par espace ouvert invalide les caches concernés et déclenche les échanges CRDT. Les notifications ne contiennent ni texte privé ni identifiant de page privée dans les événements généraux.

Les états CRDT et les projections JSON/recherche sont persistés ensemble. Les anciens documents sont convertis une seule fois sous verrou. Les remplacements explicites et restaurations conservent les identifiants CRDT. IndexedDB fusionne atomiquement les brouillons des onglets du même utilisateur ; une réponse perdue et sa retransmission ne dupliquent pas l’édition.

## Contrôles exécutés

- `pnpm test` : 159 tests réussis, 38 fichiers, sur l’état du dépôt incluant les changements parallèles de l’éditeur. Un test supplémentaire de validation des curseurs a ensuite été ajouté ; les 8 tests temps réel ciblés passent.
- `pnpm typecheck` : packages, application et tests contrôlés ; `check:structure` impose 300 lignes et une fonction autonome par fichier.
- `pnpm build` : bundles navigateur et serveur Nitro générés.
- Tests PostgreSQL publics : auteurs concurrents, édition hors ligne puis fusion, doublons, suppression CRDT, conversion et restauration, accès lecteur, révocation de partage, utilisateur étranger, entrée binaire invalide et curseur mal formé.
- Tests du fournisseur navigateur avec IndexedDB : deux brouillons hors ligne du même utilisateur survivent à la fermeture des fournisseurs ; la reprise fusionne les deux ; un accusé perdu puis retransmis converge sans nouvelle révision.
- Tests des flux : deux connexions LISTEN indépendantes reçoivent les commits, les transactions annulées ne sont pas diffusées, les flux anonymes/étrangers sont refusés et un retrait de partage ferme un flux ouvert. La présence expire et ne permet pas d’usurper le client d’une autre session.
- `SMOKE_URL=http://localhost:3011 SMOKE_PEER_URL=http://localhost:3010 pnpm smoke:realtime` : HTTP réel entre un serveur de production Nitro et un serveur de développement distinct. Titre propagé dans les deux flux et fermeture des deux après déconnexion. Mesure locale ponctuelle : **16 ms** entre l’envoi et la réception des deux notifications ; ce n’est pas une mesure de charge ni un engagement de latence en production.
- Navigateur, deux onglets : texte du second visible dans le premier sans rechargement ; annulation locale conservant le texte du premier ; titre répercuté pendant la saisie dans le titre, le fil d’Ariane et la sidebar ; avatar et curseur distant visibles ; cellule numérique passée à 42 visible dans l’autre onglet.

Les sorties des commandes sont conservées localement dans `.scratch/realtime/`. Le test HTTP réutilisable est `scripts/smoke-realtime.ts`.

## Exploitation et limites

Les réglages du reverse proxy, les migrations `0009` à `0012` et les besoins de connexion LISTEN sont documentés dans [Exploitation](../operations.md#temps-réel). Pas de serveur cloud ou de port WebSocket supplémentaire.

Les propriétés structurées et configurations de vues gardent une révision attendue : deux écritures concurrentes sur la même valeur produisent un conflit explicite, alors que les textes utilisent la fusion CRDT. Les brouillons de vue non enregistrés restent locaux. L’application ne fournit pas de démarrage PWA intégralement hors ligne. Les fichiers et les runtimes personnels imposent encore un stockage partagé et une stratégie d’exécution avant une exploitation complète sur plusieurs instances. La charge à grande échelle et le proxy de production final n’ont pas été mesurés ici.
