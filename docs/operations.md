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
