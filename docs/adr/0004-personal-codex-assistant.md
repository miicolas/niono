# Un assistant Codex personnel, avec des propositions explicites

DigiPM utilise Codex App Server 0.153.4 par stdio pour relier chaque utilisateur à son compte ChatGPT/Codex, avec un processus et un stockage privé distincts. Ce choix répond à la connexion personnelle demandée ; le fournisseur IA générique reste disponible séparément, sans basculement automatique vers une API facturée. Le protocole est isolé dans un adaptateur avec les types générés de cette version, car les outils dynamiques sont expérimentaux.

L’assistant accède à l’espace uniquement par les opérations DigiPM autorisées ; ses tours ne disposent d’aucun environnement d’exécution. Ses propositions sont persistées sans mutation, puis appliquées explicitement par les modules métier dans une transaction avec contrôle des droits, de révision et d’idempotence. Les conversations sont privées par utilisateur et espace, et la perte d’accès à une source bloque leur consultation et leur reprise.

Cette tranche conserve le monolithe et l’interrogation incrémentale, toutes les 500 ms pendant une génération. Elle nécessite une seule instance serveur active et la sauvegarde coordonnée de PostgreSQL et du volume privé Codex ; passer à plusieurs instances nécessitera une coordination durable des processus et des générations. Voir le [guide d’exploitation](../codex.md) et la [validation](../validation/codex.md).
