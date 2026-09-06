# 02 : Récupérer son compte et modifier son profil

**What to build:** Un utilisateur récupère son accès avec un email et modifie son profil sans perdre sa session de façon imprévisible.

**Blocked by:** 01

**Status:** ready-for-agent

## Critères d'acceptation

- [ ] Mailpit reçoit le reset local ; SMTP configurable en production ; mot de passe remplacé via Better Auth.
- [ ] Email de récupération avec réponse neutre, token expiré ou réutilisé refusé, destinations de retour autorisées.
- [ ] Changement de mot de passe et déconnexion respectent la politique de révocation retenue ; tentatives limitées.
- [ ] Formulaires RHF/Zod shadcn avec erreurs lisibles et navigation clavier ; tests happy path et échecs.

