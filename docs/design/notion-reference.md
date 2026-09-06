# Références visuelles et sidebar-10

## Références examinées

Recherche Mobbin effectuée le 6 septembre 2026. Les cinq écrans ci-dessous et trois aperçus d'un parcours ont été effectivement affichés et inspectés. Les liens Mobbin constituent la référence persistante ; les URLs temporaires d'images ne servent pas d'assets au produit.

| Référence | Observation visible | Traduction dans DigiPM |
| --- | --- | --- |
| [Menu slash](https://mobbin.com/screens/b8778e0e-13d3-49a6-9f01-3680ea66249b) | Liste compacte de blocs à côté du curseur ; catégories et icônes monochromes | Commande `/` navigable au clavier, filtrable et ancrée à la saisie |
| [Page et menu de bloc](https://mobbin.com/screens/042e5a4e-5020-4d8a-9881-2cf392a725cd) | Cover large, icône, titre massif ; actions de conversion, duplication et déplacement près du bloc sélectionné | Header de page, handle local et menu de bloc ; largeur de lecture maîtrisée |
| [Formatage et couleurs](https://mobbin.com/screens/1f0fc9bc-fb0c-4787-8c9b-f6a3be5dbe4b) | Barre de sélection et palette de couleurs discrètes ; citation avec trait vertical | Bubble menu Tiptap ; couleurs sémantiques texte/fond et citation simple |
| [Réglages d'une vue table](https://mobbin.com/screens/e3ebbca9-048c-4025-931e-3d4038ef82e5) | Table peu encadrée, badges colorés, panneau de configuration latéral | Grille légère, chips de propriétés et configuration de vue shadcn |
| [Tri d'une table](https://mobbin.com/screens/d89efb14-f7fd-4d1f-8395-1bfda1c7e6ae) | Tri présenté dans un petit popover proche de la barre d'outils | Filtres et tris locaux à la base, avec état actif lisible |
| [Parcours d'ajout de page](https://mobbin.com/flows/3c855d1d-cee5-467b-a1a8-1f75930cb637) | Aperçus 1, 4 et 7 : page écrite, nouvel écran de page vide, liens vers des sous-pages | Création rapide et focus sur le titre ; résultat immédiatement visible dans l'arbre |

Ces références ne permettent pas de conclure sur tous les détails d'interaction, le mobile ou les permissions Notion. Les captures restantes de ce parcours n'ont pas été inspectées. La version responsive et l'écran email/mot de passe ci-dessous sont des choix de conception DigiPM.

## Base shadcn imposée

La navigation doit partir du bloc **sidebar-10**, demandé par l'utilisateur. Registre officiel inspecté : [sidebar-10 JSON](https://ui.shadcn.com/r/styles/new-york/sidebar-10.json). Il expose AppSidebar, NavMain, NavFavorites, NavWorkspaces, NavSecondary, TeamSwitcher et NavActions, avec les primitives sidebar, breadcrumb, separator, popover, collapsible et dropdown-menu.

Commande à exécuter **dans l'application TanStack configurée**, au ticket 01 :

```sh
npx shadcn@latest add sidebar-10
```

Statut : registre inspecté ; commande d'ajout non exécutée dans ce dépôt encore sans application. Les skills Matt Pocock, eux, sont déjà installés. Le scaffold et `components.json` doivent exister avant l'ajout, pour éviter une génération Next.js involontaire.

Adaptations obligatoires :

1. Transposer la page de démonstration `app/dashboard/page.tsx` vers le layout protégé TanStack. Remplacer les liens `#` par des Link typés et les imports internes au registre par les alias configurés.
2. Alimenter TeamSwitcher depuis les workspaces autorisés et la route active ; le switch ne doit pas seulement changer un état visuel local.
3. Transformer NavWorkspaces en arbre de pages de l'espace courant. Les workspaces sont sélectionnés en haut, les pages occupent l'arbre. Conserver les groupes, affordances et primitives de sidebar-10.
4. Remplacer les données d'exemple par favoris/récents/pages persistés ; utiliser les IDs, jamais les titres, comme clés React.
5. Supprimer l'ouverture automatique de NavActions à son montage, présente dans le code de démonstration. Chaque action affichée doit fonctionner ou rester absente jusqu'à son lot.
6. Afficher Recherche, Accueil, Favoris, Pages, Modèles, Corbeille et Paramètres selon les fonctions livrées. Les exemples Ask AI/Inbox/analytics ne justifient pas des entrées inactives en V1.
7. Brancher SidebarProvider sur la navigation responsive ; contrôler son propre état d'ouverture. Zustand prend les panneaux et préférences supplémentaires, sans second booléen concurrent pour la sidebar.
8. Ajouter dnd-kit à l'arbre avec hit zones avant/après/dans, défilement automatique, interdiction des cycles et commande « Déplacer vers » utilisable au clavier.

## Direction papier

Ces valeurs sont des tokens proposés, pas des mesures exactes extraites des images Mobbin :

| Token | Valeur initiale |
| --- | --- |
| Fond page | `#FBFAF7` |
| Sidebar | `#F3F1EC` |
| Surface de menu | `#FFFEFB` |
| Texte principal | `#2F2E2B` |
| Texte secondaire | `#706D65` |
| Bordure | `#E7E3DA` |
| Survol | `#ECE8DF` |
| Sélection | `#DCEAF7` |
| Action principale | `#2769AD` |
| Typographie UI | Système sans-serif ; 14 px |
| Corps de document | Sans-serif 16 px, interligne 1,6 ; serif en préférence |
| Titre | 40 px, graisse 650–700 ; 30 px sur mobile |
| Largeur de lecture | 760 px, option pleine largeur |
| Sidebar desktop | 248 px, largeur réglable dans 220–340 px |
| Topbar | 48 px ; fil d'Ariane tronqué proprement |
| Rayons | 4–6 px contrôles ; 8 px menus |
| Ombres | Uniquement surfaces flottantes, faible opacité |

Le caractère papier repose sur la couleur, l'espace et la typographie. Pas de texture granuleuse sur le texte, ni de gros panneaux décoratifs autour du document. Les couleurs finales passent une vérification de contraste ; le thème sombre utilisera ses propres tokens. Animations de menus 120–160 ms, fermeture plus rapide, respect de reduced motion. Aucune animation à chaque frappe.

## Inventaire d'écrans

| Écran | Contenu principal | États indispensables |
| --- | --- | --- |
| Inscription / connexion | Formulaire email/mot de passe simple shadcn | Saisie, pending, erreur champ, erreur serveur |
| Récupération | Email puis nouveau mot de passe | Message neutre, token expiré, succès |
| Premier espace | Nom de l'espace et première page | Création, erreur relançable |
| Accueil | Récents, favoris, nouvelle page | Vide, chargement, erreurs |
| Page | Sidebar-10, breadcrumb, titre, icône, cover, éditeur | Vide, éditable, lecture seule, saving, conflit, hors réseau |
| Palette de recherche | Recherche et résultats autorisés | Aucun résultat, pagination, raccourcis |
| Base | Vues, propriétés, toolbar, entrées | Vide, filtré vide, erreur, nouvelle entrée |
| Entrée | Propriétés puis contenu de page | Panneau ou pleine page, conflit de cellule |
| Partage | Membres et droits hérités | Chargement, invitation, refus, changement de portée |
| Corbeille / historique | Liste récupérable, aperçu et restauration | Vide, introuvable, parent supprimé |
| Paramètres | Profil, espace, membres et export | Modifié, validation, danger confirmé |

Mobile : sidebar en panneau modal, actions tactiles explicites plutôt que hover requis, header réduit, menus adaptés à l'écran et tables à défilement horizontal. Aucun composant métier ne dépend d'un drag pour être utilisable.

La validation visuelle compare l'implémentation aux références de disposition ci-dessus, avec contenu synthétique et états déterministes. L'objectif est la fidélité des interactions et des proportions dans les contraintes choisies ; ne pas annoncer une fidélité pixel-perfect tant qu'elle n'a pas été mesurée.

## Référence prioritaire ajoutée pendant l’implémentation

L’utilisateur a ensuite précisé la [démo sombre Tiptap Notion-like](https://template.tiptap.dev/notion-like/dHRCN8qfdP?mode=dark), le [template](https://tiptap.dev/docs/ui-components/templates/notion-like-editor), le [bouton AI Ask](https://tiptap.dev/docs/ui-components/components/ai-ask-button) et [l’inventaire des composants](https://tiptap.dev/docs/ui-components/components/overview). Cette direction sombre prime sur le thème papier initial, qui reste une préférence disponible.

Le template commercial n’est pas redistribué. L’implémentation possède ses propres menus slash, barre de sélection, palette, panneau IA facultatif et poignées, construits sur les extensions open source Tiptap. Les captures du résultat sont dans `docs/validation/screenshots/`. La fidélité générale a été inspectée, sans mesure de conformité pixel à pixel.
