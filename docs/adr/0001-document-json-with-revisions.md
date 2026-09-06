# Un document Tiptap par page, protégé par révision

La V1 ne comporte pas de temps réel. Le contenu canonique d'une page est un document JSON Tiptap versionné, dont les blocs possèdent des identifiants stables ; les métadonnées et la hiérarchie sont relationnelles. Une sauvegarde compare atomiquement la révision attendue, préservant les saisies concurrentes par un conflit explicite.

Une ligne SQL par bloc ajouterait un protocole de reconstruction et des transactions complexes sans bénéfice immédiat. Un CRDT ajouterait une deuxième représentation et une infrastructure que la V1 n'utilise pas. Les identifiants de blocs et versions de schéma facilitent une migration future, mais une telle migration nécessitera un projet explicite et des tests de conversion.
