# Exploitation DigiPM

## Configuration

`BETTER_AUTH_URL` doit être l’origine exacte de l’application ; oRPC et les uploads rejettent les autres origines. Utiliser HTTPS derrière un reverse proxy en production. Le proxy doit conserver les en-têtes d’origine et accepter les uploads jusqu’à 20 Mio. Les archives JSON sont limitées à 16 Mio et 200 pages ; les documents à 2 Mio. Aucun bucket public ni serveur WebSocket n’est requis.

Les secrets restent dans un fichier privé ignoré par Git. Utiliser des mots de passe PostgreSQL hexadécimaux pour éviter les ambiguïtés d’encodage dans l’URL de connexion. Configurez SMTP_HOST/PORT/FROM et, si nécessaire, SMTP_USER/PASSWORD/SECURE. Le port 465 utilise `SMTP_SECURE=true` ; le port 587 utilise STARTTLS avec `false`. Mailpit est réservé au développement.

Les inscriptions sont publiques dans cette version. Les invitations nécessitent une adresse vérifiée et conforme à leur destinataire. Les pages privées restent inaccessibles à l’administrateur s’il n’en est ni créateur ni bénéficiaire explicite.

## Image et migrations

Préparer `.env.production` avec POSTGRES_PASSWORD, BETTER_AUTH_SECRET, BETTER_AUTH_URL et les paramètres SMTP. PORT vaut 3000 par défaut.

```sh
docker compose --env-file .env.production -f compose.production.yaml up -d --build
docker compose --env-file .env.production -f compose.production.yaml ps
```

Le service `migrate` doit finir avec le code 0, puis `app` devenir healthy. `/api/health` teste également PostgreSQL. Les volumes `postgres_data` et `assets_data` conservent les données. Le port HTTP est lié à 127.0.0.1 ; le reverse proxy expose le service. Ne pas utiliser `down -v` sur une installation à conserver.

Pour une mise à jour, sauvegarder, reconstruire et appliquer les migrations, puis tester inscription/connexion, accès à une page et upload. Le downgrade du code seul ne garantit pas la compatibilité avec un schéma migré. Conserver image et sauvegarde correspondantes.

## Sauvegarde en développement

```sh
pnpm backup .data/backups/controle
pnpm backup:verify .data/backups/controle
```

Ces scripts ciblent **compose.yaml de développement**, la base `digipm` et `ASSET_DIR`. Le second restaure vers une nouvelle base et un nouveau dossier, vérifie les clés de fichiers référencées et écrit un rapport. Il ne remplace pas la base active. Les fichiers de sauvegarde contiennent des données privées ; les déplacer vers un stockage chiffré avec accès restreint.

## Sauvegarde d’une installation Docker

Arrêter les écritures pendant la capture des deux volumes pour obtenir un ensemble cohérent. Adapter les options `--env-file`/`-p` aux noms de votre installation.

```sh
mkdir -m 700 backup
docker compose --env-file .env.production -f compose.production.yaml stop app
docker compose --env-file .env.production -f compose.production.yaml exec -T postgres pg_dump -U digipm -Fc digipm > backup/database.dump
docker compose --env-file .env.production -f compose.production.yaml run --rm --no-deps --entrypoint tar app -czf - -C /data assets > backup/assets.tar.gz
docker compose --env-file .env.production -f compose.production.yaml start app
```

Vérifier chaque code de sortie avant de redémarrer et conserver la version Git/image avec le dump. En exploitation, programmer une sauvegarde quotidienne et un exercice de restauration mensuel. Ces périodicités sont des recommandations de configuration, aucun cron n’est installé automatiquement.

## Restauration en environnement séparé

Créer une installation Compose distincte (`-p digipm-restore`) avec d’autres secrets et port, migrer puis arrêter son application. Restaurer le dump dans **sa base vide**, extraire les assets dans **son volume**, et démarrer la version de code correspondante. Vérifier les nombres de pages/documents, les fichiers privés, les permissions et les connexions avant toute bascule. Les sauvegardes de développement peuvent être validées automatiquement par `backup:verify` ; la bascule de production reste une opération d’exploitation explicite.

## Limites actuelles

Stockage local, prévu pour une seule instance web. Pour plusieurs replicas, fournir un stockage partagé avant de répartir le trafic. Pas de suppression définitive ni rétention automatique ; les anciennes versions, reçus de sauvegarde et fichiers non référencés occupent donc de l’espace. Surveiller les volumes. L’API journalise méthode, statut, durée et identifiant de requête si LOG_REQUESTS=true, sans document ni secret.

L’IA est facultative : `AI_BASE_URL` est une URL administrateur de service compatible Chat Completions, `AI_MODEL` le nom du modèle et `AI_API_KEY` sa clé éventuelle. Seul le texte explicitement sélectionné est envoyé après l’action utilisateur. Aucun service IA n’est provisionné et aucune génération n’a été validée sans fournisseur configuré.

## Assistant Codex personnel

La connexion par compte ChatGPT/Codex, le runtime privé, ses limites et la sauvegarde du volume `codex_data` sont documentés dans [Codex dans DigiPM](codex.md). Appliquer les migrations avant démarrage.

## Migration de la gestion des membres

La migration `0005_better_auth_organizations` transfère les espaces, appartenances et invitations vers Better Auth Organization et ajoute les équipes. Exécuter les migrations avant de démarrer cette version de l’application. Les espaces, comptes, rôles et contenus existants sont conservés. Les anciens liens d’invitation sont annulés et doivent être réémis depuis les paramètres ; les nouvelles invitations sont envoyées par Better Auth via le SMTP configuré. Voir [la validation](validation/better-auth.md) et [ADR 0005](adr/0005-better-auth-organizations.md).

## Temps réel

Appliquer les migrations `0009` à `0012` avant de démarrer cette version. La conversion des documents existants se fait à leur première ouverture, sous verrou, sans perte du JSON ni de l’historique. Le dump PostgreSQL inclut `collaboration_state`, les triggers et les fonctions ; ne pas reconstruire les CRDT à partir des exports JSON lors d’une restauration technique. Une importation fonctionnelle crée, elle, de nouvelles pages indépendantes.

Le proxy doit transmettre `/api/realtime` en streaming, désactiver son buffering et sa mise en cache, conserver les cookies et accepter des connexions longues. Pour nginx : `proxy_buffering off; proxy_cache off; proxy_read_timeout 60s;`. Le serveur émet un heartbeat toutes les 10 secondes et `X-Accel-Buffering: no`. Les écritures passent par les POST oRPC déjà protégés par l’origine. Aucun port supplémentaire n’est exposé.

Chaque processus web ouvre une connexion PostgreSQL LISTEN supplémentaire, distincte du pool des transactions (10 connexions). Utiliser une connexion PostgreSQL directe ou un pool en mode session pour LISTEN, jamais un pool en mode transaction. Plusieurs processus reçoivent les commits ; le stockage des fichiers doit néanmoins être partagé pour utiliser plusieurs instances de toute l’application. Le flux se réabonne après une coupure PostgreSQL et force une resynchronisation complète des caches.

Les présences expirent après 30 secondes et les lignes expirées sont supprimées lors des annonces suivantes. Elles ne constituent pas un historique d’activité. Les brouillons de contenu sont dans IndexedDB, séparés par utilisateur/espace/page et fusionnés entre onglets. Le serveur confirme l’enregistrement seulement après commit. Les clients privés d’accès ne peuvent pas publier leurs changements en attente. L’application n’est pas une PWA hors ligne : une connexion est nécessaire pour son premier chargement.
