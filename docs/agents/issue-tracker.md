# Issue tracker : Markdown local

Le dépôt n'a pas de remote configuré au 6 septembre 2026. Les arbitrages sont effectués par l'agent conformément à la demande d'autonomie de l'utilisateur.

- Spec : `.scratch/notion/spec.md`.
- Tickets : un fichier par ticket dans `.scratch/notion/issues/`, numéroté en ordre de dépendances.
- Chaque ticket contient `Blocked by`, `Status`, comportement attendu et critères vérifiables.
- Publier signifie écrire ces fichiers locaux. Aucun tracker externe n'est nécessaire.
- `ready-for-agent` décrit la qualité de la spécification ; seuls les tickets dont tous les bloqueurs sont `done` peuvent démarrer.
- Terminer un ticket exige que ses critères passent, puis mettre son statut à `done` et consigner la validation.
- Les travaux de parité encore larges restent `needs-triage` jusqu'à leur découpage en tickets exécutables.
