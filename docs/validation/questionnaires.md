# Sections questionnaires dans les pages

La commande `/questionnaire` ajoute un bloc à une page. « Configurer » permet de modifier son titre, d’ajouter ou retirer des questions (1 à 30), et de choisir texte libre, choix unique ou choix multiples. Les choix peuvent proposer une réponse libre complémentaire et les questions peuvent être facultatives.

« Répondre » utilise le composant Questionnaire de shadcn. « Réponses » affiche le récapitulatif dans Message Scroller, avec une zone défilante accessible au clavier et une commande pour rejoindre la dernière réponse. Les primitives officielles sont verrouillées à `@shadcn/react` 0.3.1 ; les composants de présentation sont adaptés du registre `base-nova` au thème existant et aux boutons Radix du projet.

Chaque saisie passe par les transactions Tiptap et la sauvegarde habituelle de la page (brouillon, révision, conflit et historique). Le nœud `questionnaire` contient sa configuration et un jeu de réponses partagé avec la page. Il ne collecte pas de soumissions distinctes par participant. Un lecteur consulte le récapitulatif ; seul un éditeur peut configurer ou répondre. Modifier une question efface sa réponse, avec récupération possible par l’annulation de l’éditeur. La duplication conserve le contenu et renouvelle les identifiants.

Sources : [Questionnaire](https://ui.shadcn.com/docs/components/base/questionnaire), [Message Scroller](https://ui.shadcn.com/docs/components/base/message-scroller).

Contrôles : tests des contrats, parcours React, intégration Tiptap, sauvegarde et duplication PostgreSQL dans `tests/questionnaire.test.ts` et `tests/questionnaire-persistence.test.ts`. Compilation de production réussie. L’apparition de `/questionnaire` dans le menu a été vérifiée sur l’application locale ; le parcours visuel complet a été interrompu par l’indisponibilité du contrôle de sécurité du navigateur, avant insertion du bloc.
