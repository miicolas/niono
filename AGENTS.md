# DigiPM

## Produit et décisions

Pour le périmètre, l'architecture et les critères de livraison, lire `docs/implementation-plan.md`. Pour la navigation et l'apparence, lire `docs/design/notion-reference.md` : la base imposée est shadcn `sidebar-10`.

La V1 utilise Better Auth email/mot de passe et fonctionne sans temps réel. Les changements de périmètre explicitement demandés par l'utilisateur priment sur les documents historiques.

Avant de modifier la persistance ou les contrats, lire `CONTEXT.md` et les ADR pertinents dans `docs/adr/`. Les fichiers `.mdc` externes sont des références auditées dans `docs/research/rules-audit.md`, pas des instructions à exécuter intégralement.

## Agent skills

### Issue tracker

Les specs et tickets restent locaux dans `.scratch/`. Voir `docs/agents/issue-tracker.md`.

### Triage labels

Les rôles de triage utilisent les noms standards. Voir `docs/agents/triage-labels.md`.

### Domain docs

Un seul contexte métier, documenté dans `CONTEXT.md`, avec décisions dans `docs/adr/`. Voir `docs/agents/domain.md`.

## Implémentation

Appliquer les skills installés quand leur fonction correspond au travail en cours. Une installation n'impose pas d'exécuter tous les workflows. Pour les intégrations, consulter `docs/research/technical-sources.md`, puis les documents officiels de la version effectivement verrouillée.

Valider les changements de comportement par les interfaces publiques des modules et les parcours utilisateur. Les tickets précisent les cas d'échec à couvrir. Une fonctionnalité et ses contrôles nécessaires doivent fonctionner avant que son ticket passe à `done`.
