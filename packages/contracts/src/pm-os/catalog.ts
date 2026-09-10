export const workflowGroups = [
  "Rédaction",
  "Stratégie",
  "Recherche",
  "Métriques",
  "Organisation",
  "Prototype",
  "Relecture",
  "Intégrations",
] as const;
export type PmWorkflow = {
  id: string;
  title: string;
  description: string;
  group: string;
};
const definitions = [
  [
    "prd-draft",
    "Rédiger un PRD",
    "Cadrer une fonctionnalité, poser les bonnes questions et rédiger son PRD.",
    "Rédaction",
  ],
  [
    "decision-doc",
    "Documenter une décision",
    "Comparer les options et conserver la décision et ses raisons.",
    "Rédaction",
  ],
  [
    "status-update",
    "Partager un avancement",
    "Préparer un point clair adapté aux parties prenantes.",
    "Rédaction",
  ],
  [
    "slack-message",
    "Rédiger un message",
    "Préparer une communication d’équipe prête à copier.",
    "Rédaction",
  ],
  [
    "create-tickets",
    "Créer des tickets",
    "Transformer un PRD ou des notes en tickets avec critères d’acceptation.",
    "Rédaction",
  ],
  [
    "launch-checklist",
    "Préparer un lancement",
    "Organiser les étapes, responsabilités et contrôles du lancement.",
    "Organisation",
  ],
  [
    "daily-plan",
    "Planifier ma journée",
    "Prioriser les sujets du jour à partir du contexte disponible.",
    "Organisation",
  ],
  [
    "weekly-plan",
    "Planifier ma semaine",
    "Définir les priorités et résultats attendus de la semaine.",
    "Organisation",
  ],
  [
    "weekly-review",
    "Faire le bilan de la semaine",
    "Comparer objectifs, réalisations, blocages et apprentissages.",
    "Organisation",
  ],
  [
    "meeting-agenda",
    "Préparer une réunion",
    "Définir les décisions attendues et un ordre du jour utile.",
    "Organisation",
  ],
  [
    "meeting-notes",
    "Structurer des notes de réunion",
    "Extraire décisions, actions et responsables d’une transcription.",
    "Organisation",
  ],
  [
    "meeting-cleanup",
    "Traiter plusieurs réunions",
    "Consolider les actions et informations de plusieurs réunions.",
    "Organisation",
  ],
  [
    "meeting-feedback",
    "Analyser une réunion",
    "Identifier ce qui a aidé la réunion et ce qui doit évoluer.",
    "Organisation",
  ],
  [
    "strategy-sprint",
    "Construire une stratégie",
    "Mener une réflexion stratégique progressive et concrète.",
    "Stratégie",
  ],
  [
    "write-prod-strategy",
    "Rédiger la stratégie produit",
    "Articuler les sept composantes d’une stratégie produit.",
    "Stratégie",
  ],
  [
    "prioritize",
    "Prioriser les initiatives",
    "Classer les initiatives avec le cadre LNO et leurs compromis.",
    "Stratégie",
  ],
  [
    "expansion-strategy",
    "Développer les comptes clients",
    "Identifier les pistes d’expansion et de croissance des comptes.",
    "Stratégie",
  ],
  [
    "impact-sizing",
    "Estimer un impact",
    "Chiffrer la valeur et expliciter hypothèses et confiance.",
    "Stratégie",
  ],
  [
    "competitor-analysis",
    "Analyser la concurrence",
    "Comparer les offres avec une recherche web et des sources datées.",
    "Recherche",
  ],
  [
    "user-interview",
    "Analyser un entretien utilisateur",
    "Extraire les observations, besoins et pistes de plusieurs entretiens.",
    "Recherche",
  ],
  [
    "user-research-synthesis",
    "Synthétiser la recherche",
    "Regrouper observations et citations en recommandations étayées.",
    "Recherche",
  ],
  [
    "interview-guide",
    "Préparer un guide d’entretien",
    "Construire des questions de découverte basées sur les besoins réels.",
    "Recherche",
  ],
  [
    "journey-map",
    "Cartographier un parcours",
    "Décrire les étapes, difficultés et opportunités d’un parcours client.",
    "Recherche",
  ],
  [
    "interview-prep",
    "Préparer un entretien PM",
    "Travailler les cas produit, exécution et comportement.",
    "Organisation",
  ],
  [
    "interview-feedback",
    "Débriefer un entretien PM",
    "Tirer des apprentissages d’un entretien professionnel.",
    "Organisation",
  ],
  [
    "define-north-star",
    "Définir la North Star",
    "Identifier la métrique qui exprime la valeur du produit.",
    "Métriques",
  ],
  [
    "metrics-framework",
    "Organiser les indicateurs",
    "Relier indicateurs avancés, résultats et décisions produit.",
    "Métriques",
  ],
  [
    "feature-metrics",
    "Définir les métriques d’une feature",
    "Choisir des métriques fiables avec le cadre STEDII.",
    "Métriques",
  ],
  [
    "experiment-metrics",
    "Mesurer une expérimentation",
    "Définir des indicateurs interprétables et leurs garde-fous.",
    "Métriques",
  ],
  [
    "experiment-decision",
    "Décider de tester ou livrer",
    "Choisir quand une expérimentation est utile.",
    "Métriques",
  ],
  [
    "activation-analysis",
    "Analyser l’activation",
    "Étudier les étapes Setup, Aha et Habit et leurs blocages.",
    "Métriques",
  ],
  [
    "retention-analysis",
    "Analyser la rétention",
    "Comparer les cohortes et comprendre rétention et attrition.",
    "Métriques",
  ],
  [
    "feature-results",
    "Évaluer une fonctionnalité livrée",
    "Comparer résultats observés, objectifs et apprentissages.",
    "Métriques",
  ],
  [
    "prototype",
    "Créer un prototype",
    "Construire un prototype interactif ou une spécification de design.",
    "Prototype",
  ],
  [
    "generate-ai-prototype",
    "Préparer un prompt de prototype",
    "Générer un brief prêt pour v0, Lovable ou Bolt.",
    "Prototype",
  ],
  [
    "napkin-sketch",
    "Esquisser une interface",
    "Représenter rapidement l’organisation et les interactions d’un écran.",
    "Prototype",
  ],
  [
    "prototype-feedback",
    "Améliorer un prototype",
    "Organiser les retours et proposer une prochaine version.",
    "Prototype",
  ],
  [
    "code-first-draft",
    "Créer une première implémentation",
    "Transformer une spécification en fichiers de code testables.",
    "Prototype",
  ],
  [
    "prd-review-panel",
    "Réunir les sept relecteurs",
    "Croiser les perspectives technique, design, direction, juridique et utilisateur.",
    "Relecture",
  ],
  [
    "ralph-wiggum",
    "Challenger un document",
    "Mettre les hypothèses à l’épreuve avec une critique directe.",
    "Relecture",
  ],
  [
    "connect-mcps",
    "Préparer des sources externes",
    "Identifier les exports nécessaires aux workflows sans connecteur actif.",
    "Intégrations",
  ],
];
export const pmWorkflows: PmWorkflow[] = definitions.map(
  ([id, title, description, group]) => ({ id, title, description, group }),
);
