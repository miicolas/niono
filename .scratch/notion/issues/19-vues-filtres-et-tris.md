# 19 : Enregistrer et partager les réglages d'une vue

**What to build:** Un membre filtre une grande base et retrouve ses vues enregistrées.

**Blocked by:** 17, 18

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] Configuration persistée versionnée : colonnes, taille, ordre, filtres AND/OR, tris et groupement.
- [ ] AST validé puis SQL paramétré selon le type ; profondeur/clauses bornées ; pagination à ordre total.
- [ ] Router possède la vue active ; filtres temporaires distincts d'une modification de vue partagée.
- [ ] TanStack Virtual limite les lignes montées ; tri manuel incompatible désactivé clairement.
- [ ] Tests résultats sur données de référence, opérateurs incorrects, navigation arrière et chargement paginé.

