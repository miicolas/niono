# Sources techniques et décisions de cadrage

Recherche effectuée le **2026-09-06**, uniquement dans les documentations et dépôts officiels. Les capacités ci-dessous sont vérifiées dans les sources ; les choix indiqués comme « décision » sont des propositions d'architecture, pas des fonctionnalités fournies automatiquement par les bibliothèques. Cette recherche précédait le bootstrap. La combinaison effectivement installée est verrouillée dans pnpm-lock.yaml et ses validations sont consignées dans docs/validation/delivery.md.

## TanStack Start, oRPC et Query

**Fait vérifié.** oRPC documente son intégration à TanStack Start par une route serveur `/api/rpc/$`, un `RPCHandler` importé depuis `@orpc/server/fetch` et un `createFileRoute` depuis `@tanstack/react-router`. Le client peut utiliser `RPCLink` dans le navigateur et un client serveur direct pendant le SSR ; le contexte de session doit être calculé pour chaque requête, jamais conservé dans un singleton partagé. [Adaptateur officiel Start](https://orpc.dev/docs/adapters/tanstack-start).

**Décision.** Les procédures oRPC constituent l'entrée des opérations métier. Elles valident l'entrée, lisent la session, appliquent les permissions puis invoquent les services métier. Better Auth conserve ses propres routes d'authentification. Aucun WebSocket, abonnement SSE, présence, Yjs actif ou moteur de collaboration en V1.

**Fait vérifié.** `createTanstackQueryUtils` fournit les options de requêtes et mutations ainsi que leurs clés. La documentation consultée affiche une installation `@beta` : son code ne doit pas être mélangé sans vérification avec une version majeure stable antérieure. [Intégration oRPC–Query](https://orpc.dev/docs/integrations/tanstack-query).

**Décision.** TanStack Query détient le cache des données serveur ; les loaders Router préchargent ce cache avec `ensureQueryData`. L'intégration `@tanstack/react-router-ssr-query` assure l'hydratation et demande un `QueryClient` neuf par requête SSR. Le streaming de la réponse SSR décrit par cette intégration ne constitue pas une synchronisation collaborative. [Chargement externe](https://tanstack.com/router/latest/docs/guide/external-data-loading), [intégration SSR](https://tanstack.com/router/latest/docs/integrations/query).

## Better Auth : email et mot de passe

**Fait vérifié.** Better Auth active ce mode avec `emailAndPassword.enabled: true`. Son client expose inscription et connexion par email ; vérification d'adresse et réinitialisation du mot de passe disposent de points d'intégration pour l'envoi d'emails. [Email et mot de passe](https://better-auth.com/docs/authentication/email-password), [utilisation du client](https://better-auth.com/docs/basic-usage).

**Décision.** Inscription, connexion, déconnexion, session et récupération du mot de passe suffisent. Prévoir un serveur email de développement puis un transport de production configurable. Pas de fournisseur OAuth, passkey, SSO ni MFA en V1.

**Fait vérifié.** Le guide Start monte `auth.handler(request)` en GET et POST sur `/api/auth/$`, recommande le SDK client et documente `tanstackStartCookies` depuis `better-auth/tanstack-start` comme dernier plugin pour les appels serveur qui écrivent des cookies. La session serveur se lit avec les headers de la requête. [Intégration Better Auth–Start](https://better-auth.com/docs/integrations/tanstack).

**Point de compatibilité.** Le guide Drizzle actuel installe `@better-auth/drizzle-adapter`, avec `provider: "pg"`, alors que la page générale d'installation contient encore `better-auth/adapters/drizzle`. Le guide distingue aussi l'import `@better-auth/drizzle-adapter/relations-v2`. Choisir l'import, le générateur de schéma et le format des relations correspondant exactement aux versions verrouillées ; faire migrer le schéma généré par Drizzle Kit. [Adaptateur Drizzle](https://better-auth.com/docs/adapters/drizzle), [installation générale](https://better-auth.com/docs/installation).

## Éditeur Tiptap et déplacement des blocs

**Fait vérifié.** Tiptap représente le contenu avec le schéma de document ProseMirror ; `editor.getJSON()` exporte le document. Tiptap recommande JSON pour la persistance. [Concepts de l'éditeur](https://tiptap.dev/docs/editor/core-concepts/introduction), [persistance](https://tiptap.dev/docs/editor/core-concepts/persistence).

**Décision.** Un éditeur Tiptap 3 par page, avec identifiants stables sur les blocs qui doivent être référencés. Le document JSON constitue la source du contenu ; texte indexable, backlinks et références sont des projections dérivées. Les métadonnées de pages et les bases de données structurées restent relationnelles. Le DOM, HTML et Zustand ne deviennent pas des copies autoritaires de ce document.

**Fait vérifié.** `@tiptap/extension-drag-handle-react` est présent dans le dépôt public avec une licence MIT : une poignée de déplacement n'impose donc pas un achat Pro. Le composant enregistre l'extension et expose notamment la gestion des blocs imbriqués. [Manifest officiel MIT](https://github.com/ueberdosis/tiptap/blob/main/packages/extension-drag-handle-react/package.json), [documentation React](https://tiptap.dev/docs/editor/extensions/functionality/drag-handle-react).

**Point à tester.** La commande d'installation de cette documentation inclut des paquets Collaboration/Yjs. Vérifier les dépendances du paquet choisi avant installation ; leur éventuelle présence technique n'autorise pas l'activation du realtime. Si nécessaire, utiliser le mécanisme documenté des NodeViews ProseMirror : `draggable: true` et `data-drag-handle`. La validation doit couvrir déplacement imbriqué, sélection, annulation et composition IME. [NodeViews React](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react).

**Décision.** Tiptap/ProseMirror gère les déplacements à l'intérieur du texte. dnd-kit gère l'arbre de pages, les propriétés et les cartes de tableaux. La documentation courante emploie `@dnd-kit/react` et éventuellement `@dnd-kit/helpers` ; l'ancien couple `@dnd-kit/core`/`@dnd-kit/sortable` est présenté comme legacy. Ne pas combiner les deux API dans une même implémentation. [Démarrage React](https://dndkit.com/react/quickstart/), [état sortable](https://dndkit.com/react/guides/sortable-state-management/).

## PostgreSQL, validation et conflits sans CRDT

**Fait vérifié.** PostgreSQL permet d'indexer le JSONB mais une modification verrouille la ligne entière. Drizzle fournit le type `jsonb` ; `.$type<T>()` assure l'inférence TypeScript, pas la validation des valeurs à l'exécution. [JSON PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html), [types Drizzle](https://orm.drizzle.team/docs/column-types).

**Décision.** Stocker le document dans `page_documents.content` JSONB avec `schema_version` et `revision`. Valider côté serveur les types de nœuds, attributs, tailles, profondeur et références autorisées. Prévoir des migrations explicites du document ; limiter la taille d'une page et mesurer avant de remplacer le document entier par une persistance fragmentée.

**Décision de concurrence.** Une sauvegarde porte `expectedRevision` et `mutationId`. Mettre à jour atomiquement la ligne identifiée et autorisée avec `WHERE revision = expectedRevision`, puis incrémenter `revision` et récupérer la valeur via `RETURNING`. À zéro ligne modifiée, distinguer ressource absente/interdite et conflit pour un utilisateur autorisé. PostgreSQL réévalue la condition après une mise à jour concurrente ; Drizzle fournit `where`, `returning` et les transactions nécessaires. [Isolation PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html), [UPDATE Drizzle](https://orm.drizzle.team/docs/update), [transactions](https://orm.drizzle.team/docs/transactions).

Une seule sauvegarde en vol par page ; coalescer les frappes suivantes. En conflit, suspendre les envois, conserver le brouillon et proposer comparaison, rechargement ou copie en nouvelle page. Un accusé perdu doit pouvoir être retrouvé grâce au `mutationId` enregistré dans la même transaction. Aucun écrasement silencieux ni fusion automatique promise. L'absence de realtime n'empêche pas les conflits entre deux onglets.

## État UI, bases de données et composants

**Décision ajoutée à la demande de l’utilisateur.** Les raccourcis utilisent TanStack Hotkeys, avec `@tanstack/react-hotkeys` **0.10.0** dans l’application et `@tanstack/hotkeys` **0.8.0** dans l’éditeur, versions exactes verrouillées dans `pnpm-lock.yaml`. Les hooks React inscrivent et nettoient les commandes de navigation ; `matchesKeyboardEvent` conserve la commande de l’assistant dans le traitement clavier ProseMirror. `Mod` correspond à Command sur macOS et Control sur Windows/Linux ; `formatForDisplay` adapte les libellés. [Guide React officiel](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/hotkeys), [formatage officiel](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/formatting-display), [version React 0.10.0](https://www.npmjs.com/package/@tanstack/react-hotkeys/v/0.10.0), [version core 0.8.0](https://www.npmjs.com/package/@tanstack/hotkeys/v/0.8.0).

`Mod+K` ouvre la recherche, y compris pendant la saisie, et ferme la navigation mobile. `Mod+B` bascule la navigation hors des champs et des zones éditables pour préserver le gras Tiptap. `Mod+J` agit sur la sélection de l’éditeur éditable et ignore la répétition et la composition IME. Les touches locales des champs, les menus slash et les commandes natives de formatage restent gérés par leurs composants. Le libellé de recherche est rempli après hydratation pour éviter une divergence entre serveur et navigateur.

**Décision.** Zustand contient largeur de sidebar, panneaux ouverts et préférences locales. Tiptap conserve sélection et transactions ; Query conserve les données serveur ; Router conserve les filtres et vues partageables dans l'URL. Un store utilisé pendant le SSR doit être isolé par requête ; les préférences persistées doivent être hydratées sans divergence du premier rendu. [Zustand et SSR](https://zustand.docs.pmnd.rs/learn/guides/nextjs.html), [persistance et hydratation](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data).

**Fait vérifié.** Table gère modèles de lignes, colonnes et état ; Virtual ne rend que les éléments visibles. La virtualisation ne réduit ni les données à télécharger ni le coût des tris et filtres serveur. **Décision :** pagination et opérations serveur via oRPC pour les grandes bases, puis virtualisation des résultats chargés. Ne pas virtualiser naïvement un document `contenteditable`. [Traitement serveur Table](https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side), [Virtual et Table](https://tanstack.com/table/latest/docs/framework/react/guide/virtualization).

**Décision.** Utiliser shadcn/ui pour les primitives et construire le thème papier dans les tokens et composants du projet. Le guide officiel couvre TanStack Router ; vérifier les adaptations Start, alias et styles au bootstrap. [Installation shadcn](https://ui.shadcn.com/docs/installation/tanstack-router).

## Graphiques de bases — TanStack Charts 0.16.0

**Décision ajoutée à la demande de l’utilisateur.** Les graphiques sont des vues enregistrées d’une base, avec filtres, propriété de regroupement, calcul, tri et présentation. Les interactions de référence sont les quatre dispositions, les réglages locaux au graphique et l’ouverture des pages d’une catégorie. [Aide officielle Notion](https://www.notion.com/help/charts).

**Version vérifiée.** `@tanstack/charts` **0.16.0** est verrouillé exactement. Son adaptateur React s’importe depuis `@tanstack/charts/react` ; `barX`, `barY`, `lineY` et `dot` couvrent les graphiques cartésiens, tandis que `pie`, `polar` et `radialArc` proviennent de `@tanstack/charts/polar`. Les définitions acceptent les infobulles, la navigation au clavier et `onSelect`. La documentation embarquée dans cette version a été consultée, car le site `latest` peut avancer indépendamment. [Présentation officielle](https://tanstack.com/charts/latest), [documentation de la version verrouillée](https://github.com/TanStack/charts/tree/v0.16.0/docs).

Les agrégations sont calculées par PostgreSQL sur toutes les entrées autorisées et filtrées, avant la limite de catégories. Le graphe n’agrège jamais uniquement la page de 50 entrées affichées dans une table. TanStack Charts reste isolé dans le rendu chargé à l’ouverture d’une vue graphique. Aucun service externe ni synchronisation en temps réel n’est ajouté. Voir [la validation des graphiques](../validation/charts.md).

## Vérifications exigées avant validation du socle

1. Verrouiller des versions compatibles et le gestionnaire de paquets ; ne pas reprendre aveuglément `latest`, `beta` ou le code de `main`.
2. Construire une route SSR avec cache isolé, une procédure oRPC authentifiée et un cycle inscription–connexion–déconnexion persistant.
3. Générer puis appliquer les migrations sur PostgreSQL vide ; contrôler les relations Better Auth et l'accès inter-workspaces.
4. Éditer, déplacer, annuler et recharger un document ; provoquer deux sauvegardes concurrentes et un accusé perdu.
5. Mesurer une grande page et une base paginée ; vérifier navigation clavier, focus et rendu hydraté.

Ces contrôles sont des critères pour le bootstrap et restent **à exécuter**.

## Better Auth Organization — version installée 1.7.3

Le plugin Organization et son client gèrent organisations, membres, rôles, invitations et équipes. Les équipes s’activent avec `teams.enabled`; les rôles de contenu se déclarent avec `createAccessControl`, `defaultStatements` et les rôles fournis par le plugin. `requireEmailVerificationOnInvitation: true` impose la vérification de l’email. [Documentation officielle](https://better-auth.com/docs/plugins/organization).

La configuration et le schéma ont été vérifiés contre le code distribué de **better-auth 1.7.3** et **@better-auth/drizzle-adapter 1.7.3**, verrouillés dans pnpm-lock.yaml. Cette version exige notamment les champs internes `team.memberCount` et `teamMember.membershipKey`, en plus de `session.activeOrganizationId` / `activeTeamId`. L’adaptateur Drizzle est configuré avec `transaction: true`. `listTeamMembers` exige l’appartenance à l’équipe ; l’interface conserve cette règle native, y compris pour un administrateur.

## Collaboration temps réel — versions verrouillées

Tiptap Collaboration et Collaboration Caret **3.31.3**, Yjs **13.6.27**, y-prosemirror **1.3.7**, y-protocols **1.0.6** et lib0 **0.2.114** sont verrouillés. Les implémentations installées ont été consultées, notamment le contrat `provider.on/off("synced")` de UniqueID 3.31.3 et la liaison d’awareness de Collaboration Caret. StarterKit désactive son UndoRedo en collaboration ; l’historique Yjs annule les modifications locales. [Guide Tiptap](https://tiptap.dev/docs/hocuspocus/guides/collaborative-editing), [présence Yjs](https://docs.yjs.dev/getting-started/adding-awareness), [binding ProseMirror](https://github.com/yjs/y-prosemirror/tree/v1.3.7).

Le serveur conserve les mises à jour binaires et utilise `updateYFragment` sur le document existant pour les remplacements explicites, jamais une conversion JSON pour réhydrater un CRDT actif. Les positions des sélections restent relatives au document. Les notifications SQL sont émises par les triggers transactionnels : un rollback ne produit pas de notification. [NOTIFY PostgreSQL 17](https://www.postgresql.org/docs/17/sql-notify.html), [LISTEN PostgreSQL 17](https://www.postgresql.org/docs/17/sql-listen.html).

## Médias et mentions — 9 septembre 2026

Tiptap **3.31.3** : les NodeViews React conservent les nœuds du schéma et appellent `updateAttributes`/`deleteNode` pour les commandes. Les attributs média sont partagés avec le schéma serveur et la projection collaborative ; la suppression conserve les fichiers nécessaires à l’historique. [NodeViews React officielles](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react), [comportements des médias Notion](https://www.notion.com/help/images-files-and-media).

Nitro **3.0.260610-beta** : son middleware Vite écarte les requêtes `Sec-Fetch-Dest: image` lorsqu’elles ne correspondent qu’au renderer générique. La route explicite `/api/assets/**` délègue via l’API exportée `fetchViteEnv("ssr", req)` au transport Start authentifié. Ce comportement et l’API ont été vérifiés dans le code de la version installée, puis reproduits et testés par HTTP. [Présentation officielle Nitro](https://nitro.build/). Voir [la validation](../validation/editor-media.md).
