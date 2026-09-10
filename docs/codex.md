# Codex dans DigiPM

L’entrée **Codex** de la navigation ouvre un assistant personnel. Dans **Paramètres → Votre compte Codex**, choisissez **Connecter mon compte Codex**, ouvrez l’adresse officielle affichée et saisissez le code. Chaque utilisateur connecte son propre compte ChatGPT/Codex. L’authentification à DigiPM reste email/mot de passe.

## Travailler sur un espace

La conversation est rattachée à l’espace actif. Elle peut rechercher/lire les pages accessibles, consulter une base et préparer des créations de pages ou d’entrées, changements de titre/contenu et modifications de propriétés existantes. Les sources apparaissent sous la réponse. Une sélection dans l’éditeur ouvre le même assistant avec des commandes de correction, amélioration, résumé et traduction.

Chaque proposition présente un aperçu. **Appliquer** effectue la modification, **Refuser** la conserve comme refusée. Une sélection peut être remplacée ou suivie du texte proposé. Les brouillons sont enregistrés avant application ; un conflit conserve le texte local et impose une nouvelle proposition. Chaque modification IA d’un document crée un instantané dans l’historique de la page.

Les conversations sont privées et séparées par espace. Une source devenue inaccessible bloque leur affichage/reprise. Leur suppression efface messages et propositions dans DigiPM et appelle `thread/delete` dans le runtime privé. Les copies dans des sauvegardes déjà réalisées suivent leur politique de rétention.

## Installation

- Node 24 ou 25 et `pnpm install --frozen-lockfile`, puis `pnpm db:migrate`.
- `@openai/codex` est verrouillé à **0.153.4**. Le runtime refuse une autre version. `CODEX_BIN` permet de désigner explicitement un binaire de cette version ; sans cette variable, le paquet npm installé est utilisé.
- `CODEX_DATA_DIR` désigne un dossier privé persistant, `.data/codex` par défaut, `/data/codex` en Docker. Les chemins relatifs sont résolus depuis le répertoire de lancement pnpm (`INIT_CWD`), ou le répertoire courant sans pnpm ; un chemin absolu est recommandé en exploitation. Chaque utilisateur reçoit un sous-dossier opaque en mode 0700. Ne jamais le servir comme un répertoire public.
- Docker installe le binaire verrouillé et utilise le volume `codex_data`. L’application fonctionne avec **une seule instance serveur** dans cette tranche. Ne pas partager ce volume entre plusieurs réplicas actifs.
- Le serveur doit pouvoir joindre les services d’authentification ChatGPT/Codex et le service de génération. Aucun port app-server public n’est nécessaire : le protocole passe par stdio.

Le runtime possède une configuration privée qui désactive shell, exécution, fichiers/images hôtes, navigateur, apps, plugins, skills externes et sous-agents ; les tours n’ont aucun environnement d’exécution. Aucun identifiant du Codex installé sur le poste n’est importé. Les événements bruts et secrets ne sont pas renvoyés au navigateur ni aux logs HTTP.

Les types consommés sont générés par `codex app-server generate-ts --experimental` sur 0.153.4 dans `packages/server/src/codex/protocol`. Toute mise à niveau doit régénérer les types et revalider les tests du protocole et des capacités. Les outils dynamiques sont expérimentaux.

## Limites et récupération

Une demande est bornée à cinq minutes, 60 000 caractères de réponse, 20 propositions ; une conversation à 100 échanges et 200 sources. La recherche renvoie au plus 40 pages, les bases 30 entrées par page. Les documents de plus de 100 000 caractères JSON demandent de sélectionner un passage. Les processus privés inactifs sont arrêtés après dix minutes et redémarrés au besoin.

Le navigateur interroge les événements toutes les 500 ms uniquement pendant une génération. Un redémarrage serveur marque les demandes orphelines en échec lors de leur consultation ; elles ne sont pas relancées silencieusement. Une requête d’envoi et une application peuvent être réessayées avec leur identifiant sans doublon. L’arrêt ne retire pas les modifications déjà acceptées.

Une connexion refusée/expirée demande une reconnexion. Un quota ou une erreur du fournisseur termine la demande avec un message relançable. L’application n’utilise aucune clé API de secours et ne consomme pas automatiquement un crédit de réinitialisation.

Le fournisseur générique `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY` et son contrat existant sont conservés séparément ; Codex ne bascule jamais vers celui-ci.

## Sauvegarde et restauration

Arrêter le serveur DigiPM et ses processus Codex avant une sauvegarde cohérente des conversations. Sauvegarder PostgreSQL, les assets et le dossier/volume Codex du même instant. `pnpm backup` inclut `codex.tar.gz` lorsque `CODEX_DATA_DIR` est accessible localement ; en production Docker, sauvegarder séparément le volume `codex_data` arrêté si celui-ci n’est pas monté dans le contexte du script.

L’archive Codex contient des identifiants de connexion : conserver les sauvegardes privées et chiffrées, accessibles seulement à l’administrateur. Le script écrit l’archive en mode 0600. Restaurer les trois ensembles avant de redémarrer une seule instance ; conserver les propriétaires et droits privés. `pnpm backup:verify <dossier>` extrait aussi le stockage Codex dans le dossier de restauration, sans lancer le runtime ni réutiliser les identifiants. En cas de révocation ou d’expiration des identifiants restaurés, chaque utilisateur se reconnecte.

## Vérification réelle

Les tests automatisés utilisent un transport et un compte simulés pour les générations, avec PostgreSQL réel pour les permissions et écritures. La validation d’un compte réel exige sa connexion personnelle, puis une question sur une page de test et l’application d’une proposition. Ne pas utiliser un compte DigiPM de démonstration à mot de passe partagé pour conserver un compte Codex personnel.
