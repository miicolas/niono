# Espace de travail DigiPM

Un espace de travail réunit des documents et des informations structurées que ses membres organisent sous forme de pages.

## Langage

**Utilisateur** : personne disposant d'un compte et pouvant appartenir à plusieurs espaces de travail.

**Espace de travail (Workspace)** : ensemble de contenus, de membres et de règles d'accès administré indépendamment des autres espaces.

**Membre** : appartenance d'un utilisateur à un espace de travail, avec un rôle.

**Page** : document identifiable pouvant contenir des blocs, des sous-pages et des propriétés. Une entrée de base est également une page.

**Bloc** : élément de contenu d'une page, tel qu'un paragraphe, une liste, une image ou une référence à une autre page.

**Sous-page** : page placée sous une autre page dans l'arborescence. Une référence à une page n'en fait pas une sous-page.

**Base** : conteneur permettant de consulter une ou plusieurs sources de données au travers de vues.
_Éviter_ : table SQL, liste de lignes sans pages.

**Source de données** : ensemble d'entrées partageant les mêmes définitions de propriétés. La première version associe une seule source à chaque base.

**Entrée** : page appartenant à une source de données, visible comme ligne dans une table ou comme carte dans un tableau.

**Propriété** : information définie sur une source de données, par exemple statut, date ou nombre, et renseignée sur ses entrées.

**Vue** : présentation enregistrée d'une source, avec disposition, colonnes, filtres, tri et groupement. Elle n'est pas une copie des entrées.

**Révision** : état enregistré d'un contenu, permettant d'identifier des modifications concurrentes et de restaurer une version antérieure.

**Brouillon local** : modification conservée sur l'appareil qui n'a pas encore été confirmée comme enregistrée sur le serveur.

**Partage** : droit accordé à une personne, à des membres ou au public pour consulter ou modifier un contenu.

**Corbeille** : ensemble de pages retirées de la navigation et récupérables pendant leur durée de conservation.
