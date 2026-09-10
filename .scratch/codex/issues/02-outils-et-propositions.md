# 02 — Conversations, sources et propositions

Blocked by: 01
Status: in-progress

Historique personnel par espace, lectures bornées, sources contrôlées, propositions sans mutation, application transactionnelle/idempotente et instantané avant chaque changement IA du document.

Critères : isolation entre comptes/espaces, lecture seule, révocation avant lecture/reprise/application, absence de doublon sous concurrence, conflit sans écrasement, insertion/remplacement de sélection, création de page/entrée et changement de cellule. Tests PostgreSQL requis.

Validation locale : voir `docs/validation/codex.md`. Implémentation et contrôles automatisés réalisés ; recette personnelle de connexion/génération encore ouverte.
