# Codex personnel dans DigiPM

Assistant intégré à sidebar-10 et à la sélection Tiptap, connecté par code au compte personnel ChatGPT/Codex. Les conversations sont privées et isolées par espace. Codex recherche et lit les pages, consulte les bases et propose des créations de pages/entrées, changements de titre/contenu et valeurs des propriétés existantes. L’utilisateur examine puis applique ou refuse chaque proposition.

Le contrat de référence est l’ADR 0004. Le fournisseur IA générique demeure disponible séparément ; aucun basculement automatique ni clé partagée. Aucun outil de shell, fichier hôte, navigation web, connecteur personnel, permission, suppression de page ou modification de structure de base.

Livraison : tests de modules sur PostgreSQL, tests du transport et des scénarios d’exécution, TypeScript, build, parcours navigateur ordinateur/mobile. La connexion et une génération avec un compte réel restent un critère distinct exigeant l’authentification personnelle de l’utilisateur.
