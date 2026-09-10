# Médias, liens et mentions — 9 septembre 2026

## Livré

- Blocs `/image`, `/file`, `/bookmark` et `/mention` dans le menu de commandes.
- Images et fichiers : upload par champ fichier, collage et dépôt, URL externe, nom, légende, remplacement et téléchargement privé. Les images ajoutent texte alternatif, largeur, alignement et poignée de redimensionnement utilisable au clavier.
- Uploads multiples par collage/dépôt : ordre conservé, emplacement suivi pendant les transactions, état d’envoi, erreur relançable, annulation et protection contre un résultat tardif après fermeture ou passage en lecture seule.
- Suppression et duplication des médias, avec actions séparées dans l’historique local et collaboratif. Le fichier physique reste disponible pour l’annulation, les anciennes versions et les copies de page.
- Signets : URL, titre, description et légende éditables. Coller une URL propose de conserver le lien, de créer un signet ou d’intégrer une image. Coller sur du texte applique le lien à la sélection. Un clic sur un lien éditable ouvre ses commandes de modification, ouverture et retrait.
- Mentions : `@` propose les pages autorisées, les personnes de l’organisation Better Auth et des dates ; `[[` limite la recherche aux pages. Flèches, Entrée, Tab et Échap sont pris en charge. Les dates sont enregistrées comme dates absolues. La recherche est bornée et ignore les réponses obsolètes.
- Les nouveaux nœuds et attributs sont conservés par la normalisation, le document collaboratif, la sauvegarde, la duplication et l’archive JSON. Les mentions internes au sous-arbre copié sont remappées. Le texte de recherche inclut leurs libellés et les descriptions des médias.

## Vérification

`pnpm typecheck` et `pnpm build` passent. Le contrôle de structure porte sur plus de 900 fichiers, avec au maximum 300 lignes et une fonction autonome par fichier.

Les suites ciblées couvrent les médias, liens, mentions, contrats documentaires, sauvegarde en base, menu contextuel, questionnaires, contenu et raccourcis : 59 tests réussis, puis un test supplémentaire de remplacement depuis le champ fichier ajouté et vérifié. Le parcours HTTP passe avec `SMOKE_URL=http://localhost:3001 pnpm smoke:http` : inscription, session, droits, sauvegarde, conflits, export/import, upload, téléchargement, CSRF et déconnexion.

Le test HTTP reproduit maintenant les en-têtes d’une balise `img`. **Défaut trouvé et corrigé :** Nitro 3.0.260610-beta considérait les requêtes `Sec-Fetch-Dest: image` comme des fichiers statiques et ignorait la route Start générique. Une route Nitro explicite `/api/assets/**` délègue au même service Start. L’authentification, les droits et la réponse binaire restent dans le transport existant. Aucun contournement des permissions n’est ajouté.

Dans le navigateur intégré, la page « Validation — médias, liens et mentions » a servi à vérifier les commandes slash, l’image par URL avec légende et largeur, la carte de signet, les suggestions réelles de personnes et dates, la suppression/annulation et le collage d’un PNG envoyé sur `/api/assets/…`. Le rechargement conserve les blocs. À 390 px, la largeur du document reste de 390 px sans débordement horizontal ; les figures occupent au maximum les 342 px de contenu. Le viewport de test a été réinitialisé.

Le sélecteur natif de fichiers n’a pas pu être piloté par l’outil intégré (attente du file chooser expirée). Son événement de sélection et le remplacement sont couverts par les tests de composants ; le transport a été exercé par collage réel et HTTP.

Une exécution plus large a également produit 139 tests réussis et deux échecs du worker PM-OS, liés au service absent sur `127.0.0.1:8090`. Ces échecs sont extérieurs aux parcours de l’éditeur.

## Écarts de parité

Les signets n’extraient pas automatiquement titre, favicon ou illustration d’un site externe. Les descriptions restent éditables, sans fetch arbitraire du serveur. Les mentions n’envoient pas de notifications ; leurs libellés sont ceux enregistrés lors de l’insertion. Le recadrage, les masques, la bibliothèque Unsplash, les embeds de services, les lecteurs audio/vidéo, les backlinks enrichis et les commentaires restent à réaliser. Cette livraison ne constitue donc pas une parité complète de Notion.

## Références

Comportements de référence : [médias Notion](https://www.notion.com/help/images-files-and-media), [liens et backlinks Notion](https://www.notion.com/help/links-and-backlinks). La mise en œuvre utilise les [NodeViews React Tiptap](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react) de la version verrouillée 3.31.3. Les attributs d’image et la gestion de l’historique ont été vérifiés dans le code distribué localement. Le routage Nitro a été vérifié dans la version verrouillée, notamment `dist/_build/vite.dev.mjs` et `dist/runtime/vite.mjs` ; [documentation officielle Nitro](https://nitro.build/).
