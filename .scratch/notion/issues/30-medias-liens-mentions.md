# 30 — Médias, liens et mentions dans l’éditeur

Blocked by: aucun (socle existant)
Status: done

## Comportement attendu

Images et fichiers : import multiple, collage et dépôt au bon endroit, état d’envoi, erreurs relançables et annulation ; source par URL ; remplacement, téléchargement, légende, texte alternatif, alignement, largeur et suppression annulable. Signets : carte URL avec titre et description éditables, conversion depuis un lien collé. Mentions : suggestions de pages autorisées, personnes de l’espace et dates au clavier via @ et [[ pour les pages. Liens : coller sur une sélection, ouvrir, modifier et retirer.

## Critères

- Sauvegarde, rechargement, historique et document collaboratif conservent les nouveaux nœuds et attributs.
- La suppression retire le bloc ; annuler restaure la ressource. Les fichiers restent disponibles pour les versions et copies existantes.
- Un upload tardif respecte son point d’insertion, l’annulation et la lecture seule.
- Les URL dangereuses et attributs malformés sont rejetés ; aucun téléchargement arbitraire d’URL par le serveur.
- Suggestions sans résultat, erreurs réseau, recherche obsolète, navigation clavier et lecture seule testées.
- Contrôle de structure, TypeScript, tests ciblés, build et parcours navigateur.

## Limites de ce lot

L’enrichissement automatique des signets, les notifications de mention, les intégrations externes, le recadrage et les masques ne sont pas couverts par ce ticket. La parité complète reste suivie dans la matrice du projet.

## Validation

Voir `docs/validation/editor-media.md` : tests ciblés, test HTTP avec requêtes image, TypeScript, structure, build et parcours du navigateur. La sélection native du fichier reste une vérification manuelle ; la sélection du champ, le remplacement, le collage réel et le transport sont contrôlés.
