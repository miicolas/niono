# États de l’interface — 6 septembre 2026

Les erreurs globales, pages introuvables et erreurs de chargement utilisent une présentation commune : illustration discrète, titre hiérarchisé, explication en français et actions de reprise. Les réponses techniques du serveur ne sont pas affichées telles quelles. Les erreurs de session, d’accès et de connexion ont des messages adaptés.

Les chargements de l’espace, de la navigation, des pages, de l’éditeur, des bases, des listes et des pages récentes utilisent des squelettes. Les états vides de la recherche, de la corbeille et des bases sont distincts des chargements et des erreurs. Effacer une recherche replace le focus dans son champ.

## Vérifications

| Contrôle | Résultat |
| --- | --- |
| `vitest run tests/content-states.test.ts` | 7 tests réussis : chargement, erreur, reprise, résultat vide, retour du focus, session expirée, connexion interrompue et rétablie |
| Tests `shadcn-controls` et `shadcn-overlays` | 8 tests réussis |
| `pnpm build` | Réussi après intégration à la nouvelle organisation des fichiers |
| Vérification navigateur | Erreur générique et accès refusé, route introuvable, chargement de l’espace ; formats 1440, 1024 et 390 px |
| Mobile | Pas de débordement horizontal sur les états vérifiés ; actions de 44 px |
| Contraste des descriptions | 5,15:1 sur le fond papier et 4,93:1 sur une surface papier ; supérieur à 4,5:1 dans le thème sombre |
| Réduction des animations | Squelettes et indicateurs immobiles avec `prefers-reduced-motion: reduce` |

Le contrôle TypeScript global a rencontré deux erreurs dans des modifications simultanées de Codex : l’action `rememberPage` n’est pas encore traitée dans `codex-panel/proposal-card.tsx` et `codex/proposals/decide-proposal.ts`. Ces changements sont en dehors de la refonte des états. Les erreurs de compilation liées à l’extraction des composants de page, d’accueil, de navigation et de table ont été corrigées.

La session du navigateur local renvoyait un refus d’accès à l’espace. La route introuvable et cet écran de refus ont été vérifiés dans l’application ; les autres captures utilisent les composants réels dans un aperçu local, et les parcours de recherche et de corbeille sont validés par leurs interfaces publiques avec des réponses réseau simulées.

## Captures

- [Erreur sur ordinateur](../../output/ui-states/error-desktop.png)
- [Page introuvable sur mobile](../../output/ui-states/not-found-mobile.png)
- [Erreur en thème papier](../../output/ui-states/error-paper-mobile.png)
- [Chargement sur tablette](../../output/ui-states/loading-tablet.png)
- [Chargement sur mobile](../../output/ui-states/loading-mobile.png)

L’aperçu de vérification se trouve dans `apps/web/.scratch/ui-states-preview/`. Il n’ajoute aucune route à l’application.
