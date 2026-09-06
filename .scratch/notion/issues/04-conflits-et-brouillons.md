# 04 : Conserver les brouillons et résoudre les conflits de sauvegarde

**What to build:** Deux onglets ou une coupure réseau ne font pas disparaître une saisie.

**Blocked by:** 03

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] CAS concurrent : un seul gagnant et un CONFLICT explicite ; aucune stratégie last-write-wins silencieuse.
- [ ] Reçu mutationId avec empreinte de payload enregistré dans la même transaction ; retry après ACK perdu renvoie le résultat d'origine.
- [ ] Brouillon IndexedDB segmenté utilisateur/workspace/page, révision de base conservée ; refetch ne remplace pas une édition sale.
- [ ] Recharger, exporter/comparer et enregistrer une copie sont disponibles pour résoudre un conflit ; changement de session ne révèle pas un autre brouillon.
- [ ] Tests deux clients PostgreSQL, réseau interrompu, réponse tardive, navigation et reconnexion.

