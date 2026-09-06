# 03 : Écrire et enregistrer un document Tiptap

**What to build:** Un propriétaire rédige une page et retrouve exactement son texte après rechargement.

**Blocked by:** 01

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] Une instance Tiptap par page, schéma JSON versionné et IDs de blocs stables ; paragraphes, titres et formatage inline.
- [ ] Sauvegarde oRPC autorisée avec révision atomique, statut visible et révisions de contenu séparées des métadonnées.
- [ ] Réponse de sauvegarde n'efface pas les saisies postérieures ; requêtes sérialisées et débounce documenté.
- [ ] Schéma et tailles validés au serveur, contenu rendu sans HTML actif ; saisie avec accents et composition IME testée.

