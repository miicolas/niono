# Validation de l’intégration Codex — 6 septembre 2026

L’implémentation et ses contrôles locaux sont réalisés. La recette avec un compte ChatGPT/Codex personnel et une génération réelle reste ouverte ; l’intégration n’est pas encore déclarée fonctionnelle de bout en bout.

## Contrôles exécutés

| Contrôle                                                                              | Résultat                                                                                                                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:migrate`                                                                     | Migration `0004_rainy_bloodstorm.sql` appliquée à PostgreSQL local.                                                                               |
| `pnpm test`                                                                           | 50 tests réussis dans 7 fichiers, dont 24 tests Codex dans 4 fichiers.                                                                            |
| `pnpm typecheck`                                                                      | Packages, application et fichiers de vérification valides.                                                                                        |
| `pnpm build`                                                                          | Build de production réussi ; avertissement de taille du bundle éditeur conservé.                                                                  |
| `docker compose -f compose.production.yaml build app`                                 | Image construite avec le runtime verrouillé et le volume privé prévu.                                                                             |
| `docker run --rm --entrypoint codex digipm-app --version`                             | `codex-cli 0.153.4`.                                                                                                                              |
| Prettier sur les nouveaux modules/tests et scripts de sauvegarde ; `git diff --check` | Réussite.                                                                                                                                         |
| Sauvegarde et restauration                                                            | Archive Codex de test sans identifiants, créée en mode 0600, restaurée avec PostgreSQL et 63 assets ; aucun runtime lancé depuis la restauration. |

Les tests métier utilisent PostgreSQL réel : sources et pages privées, isolation des propriétaires et des espaces (y compris deux espaces du même utilisateur), rôle lecteur, révocation, créations de pages/entrées, valeurs de propriétés, refus définitif, double application concurrente, conflits, sélection remplacée/insérée et instantané avant chaque modification du document.

Les tests de génération simulent le fournisseur : code accepté/refusé/expiré/annulé, déconnexion, progression et historique, reprise, idempotence d’envoi, erreur/quota, panne, interruption et rejet des outils tardifs, révocation pendant la génération, suppression pendant le démarrage sans conversation native orpheline. Le transport stdio est testé avec un processus local : messages fragmentés, réponses corrélées, délai d’expiration, arrêt du processus, outil dynamique autorisé et refus des autres requêtes du runtime.

Les tests React vérifient l’aperçu avant application, l’appel explicite d’application, les liens vers les sources et le masquage du contenu inaccessible. Les scripts de sauvegarde ont été exécutés avec un dossier Codex factice ; cela ne constitue pas une restauration de compte authentifié.

## Runtime et navigateur réels

Le runtime npm 0.153.4 démarre avec un répertoire neuf, renvoie un compte absent, accepte la configuration désactivant les capacités hôtes et crée puis supprime un thread sans environnement d’exécution. Ses identifiants sont distincts de l’application Codex du poste.

Sur `http://localhost:3001`, le navigateur a permis de vérifier l’ouverture/fermeture depuis la navigation, les paramètres personnels, l’obtention d’un code sur l’adresse officielle `auth.openai.com`, puis son annulation. Le code n’a pas été utilisé pour associer un compte personnel au compte DigiPM de démonstration.

Le panneau a été inspecté sur ordinateur (1280 × 720) et sur mobile (390 × 844, plein écran). Une sélection dans « Carnet de test » affiche « Demander à Codex » et ouvre le même panneau sans modifier le document.

## Recette personnelle restante

1. Ouvrir DigiPM avec son propre compte, puis **Paramètres → Votre compte Codex → Connecter mon compte Codex**, et terminer le parcours officiel par code.
2. Demander le résumé d’une page de test et vérifier la progression, la réponse et ses sources.
3. Demander une correction de sélection, examiner l’aperçu puis appliquer ; vérifier la sauvegarde, l’instantané et la reprise de la conversation.
4. Vérifier le même échange sur mobile, puis la déconnexion.

Les tickets dans `.scratch/codex/` restent `in-progress` jusqu’à cette recette. Le [guide Codex](../codex.md) décrit les limites d’exploitation et l’[ADR 0004](../adr/0004-personal-codex-assistant.md) consigne la décision.
