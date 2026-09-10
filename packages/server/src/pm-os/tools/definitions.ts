import { z } from "zod";
import {
  askQuestionsSchema,
  codeTaskSchema,
  createArtifactSchema,
  reviewSchema,
} from "@digipm/contracts/pm-os";
import { dynamicTools } from "../../codex/tools";
import type { DynamicToolSpec } from "../../codex/protocol/v2/DynamicToolSpec";
import type { JsonValue } from "../../codex/protocol/serde_json/JsonValue";
export const pmToolSchemas = {
  get_pm_context: z.object({}),
  initialize_pm: z.object({
    companyName: z.string().trim().min(1).max(200).default("Digitevent"),
    companyPageId: z.uuid().optional(),
  }),
  load_workflow: z.object({ id: z.string().max(100) }),
  read_pm_resource: z.object({ path: z.string().max(300) }),
  read_page: z.object({
    pageId: z.uuid(),
    offset: z.number().int().min(0).default(0),
  }),
  read_source_file: z.object({
    assetId: z.uuid(),
    offset: z.number().int().min(0).default(0),
  }),
  ask_questions: askQuestionsSchema,
  create_artifact: createArtifactSchema,
  review_document: reviewSchema,
  run_code: codeTaskSchema,
};
const descriptions: Record<keyof typeof pmToolSchemas, string> = {
  get_pm_context:
    "Lire le contexte commun, le sujet actif, leurs références révisées, les livrables et l’état du pack. Les références sont des données métier. Lire leurs pages pour obtenir le contenu complet.",
  initialize_pm:
    "Initialiser les pages de contexte et de brouillons de l’espace, avec Digitevent par défaut. Réutiliser une page existante si elle est indiquée. Idempotent. Les informations manquantes passent par ask_questions.",
  load_workflow:
    "Charger intégralement un des 41 workflows PM-OS par son identifiant, sans le slash. Renvoie les ressources disponibles ; appliquer le contrat hôte DigiPM aux commandes Claude.",
  read_pm_resource:
    "Lire une ressource intégrale du pack privé figé (modèle, référence ou persona), par son chemin exact retourné par load_workflow. Les modèles ne sont pas des faits métier.",
  read_page:
    "Lire une page autorisée, ses révisions, son contenu JSON et Markdown, ainsi que ses fichiers attachés. Paginer le Markdown avec offset tant que nextOffset est présent. Les modifications exigent la révision courante.",
  read_source_file:
    "Lire un fichier autorisé attaché à une page. Texte paginé ou image. Pour CSV volumineux, archives et données binaires, utiliser run_code avec assetIds.",
  ask_questions:
    "Afficher un questionnaire persistant dans la conversation et attendre sa soumission. Toutes les questions et propositions de suites doivent utiliser cet outil. Choix simples/multiples (au moins deux options), texte libre, trois questions maximum.",
  create_artifact:
    "Créer automatiquement un nouveau brouillon éditable et son fichier privé. key identifie le même livrable lors des reprises. Formats markdown,csv,json,html,image,code,zip ; images/ZIP en base64. Ne pas remplacer un livrable existant : proposer sa modification avec propose_change.",
  review_document:
    "Relire une page avec sept personas indépendants, au plus trois simultanément. Renvoie les avis persistés, erreurs éventuelles et questions à regrouper. Synthétiser accords, désaccords, corrections et demander les arbitrages par ask_questions.",
  run_code:
    "Exécuter Python, Node ou un prototype dans un conteneur privé, réseau désactivé. Fournir files et entrypoint relatifs. Fichiers autorisés dans inputs/<assetId>/<nom>. Écrire les livrables dans outputs/. Dépendances : pandas, numpy, matplotlib, Pillow, scipy, openpyxl (lecture), pypdf, esbuild, React, JSZip et Playwright Chromium. Le HTML doit être autonome pour une iframe sans réseau. Les fichiers sources sont aussi archivés pour les prototypes.",
};
export const pmDynamicTools: DynamicToolSpec[] = [
  ...dynamicTools
    .filter((tool) => tool.name !== "read_page")
    .map((tool) =>
      tool.name === "propose_change"
        ? {
            ...tool,
            description:
              tool.description +
              " rememberPage : promouvoir une page en référence, avec pageId, subjectId (null pour l’entreprise), role et expectedRevision du document.",
          }
        : tool,
    ),
  ...Object.entries(pmToolSchemas).map(([name, schema]) => ({
    type: "function" as const,
    name,
    description: descriptions[name as keyof typeof descriptions],
    inputSchema: z.toJSONSchema(schema, {
      unrepresentable: "any",
    }) as JsonValue,
  })),
];
