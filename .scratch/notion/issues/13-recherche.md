# 13 : Rechercher des titres et du contenu

**What to build:** Un membre retrouve rapidement une page par son titre ou son texte.

**Blocked by:** 05, 07, 09

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] PostgreSQL full-text et pg_trgm indexent un texte dérivé reconstructible ; résultats paginés.
- [ ] Palette Cmd/Ctrl+K avec clavier, recherche vide et absence de résultats ; requête dans Router selon contexte.
- [ ] Filtrage d'accès et corbeille appliqué avant résultats et extraits ; index ne révèle pas de contenu interdit.
- [ ] Tests pertinence minimale, accents, titres identiques, tenant concurrent et requête volumineuse.

