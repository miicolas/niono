import { db, schema as s } from "@digipm/db";
import { eq, inArray, asc } from "drizzle-orm";
export async function pmSnapshot(conversationId: string) {
  const runs = await db
    .select()
    .from(s.pmRuns)
    .where(eq(s.pmRuns.conversationId, conversationId))
    .orderBy(asc(s.pmRuns.createdAt));
  if (!runs.length)
    return { runs: [], questionnaires: [], artifacts: [], reviews: [] };
  const runIds = runs.map((run) => run.id);
  const questionnaires = await db
    .select({
      id: s.pmQuestionnaires.id,
      runId: s.pmQuestionnaires.runId,
      definition: s.pmQuestionnaires.definition,
      answers: s.pmQuestionnaires.answers,
      status: s.pmQuestionnaires.status,
      revision: s.pmQuestionnaires.revision,
    })
    .from(s.pmQuestionnaires)
    .where(inArray(s.pmQuestionnaires.runId, runIds))
    .orderBy(asc(s.pmQuestionnaires.createdAt));
  const artifacts = await db
    .select({
      id: s.pmArtifacts.id,
      runId: s.pmArtifacts.runId,
      pageId: s.pmArtifacts.pageId,
      assetId: s.pmArtifacts.assetId,
      name: s.assets.name,
      format: s.pmArtifacts.format,
      documentRevision: s.pmArtifacts.documentRevision,
      title: s.pages.title,
    })
    .from(s.pmArtifacts)
    .innerJoin(s.assets, eq(s.assets.id, s.pmArtifacts.assetId))
    .innerJoin(s.pages, eq(s.pages.id, s.pmArtifacts.pageId))
    .where(inArray(s.pmArtifacts.runId, runIds))
    .orderBy(asc(s.pmArtifacts.createdAt));
  const reviews = await db
    .select({
      id: s.pmReviews.id,
      runId: s.pmReviews.runId,
      persona: s.pmReviews.persona,
      status: s.pmReviews.status,
      text: s.pmReviews.text,
      error: s.pmReviews.error,
    })
    .from(s.pmReviews)
    .where(inArray(s.pmReviews.runId, runIds))
    .orderBy(asc(s.pmReviews.createdAt));
  return {
    runs,
    questionnaires,
    artifacts: artifacts.map((artifact) => ({
      ...artifact,
      url: "/api/assets/" + artifact.assetId,
    })),
    reviews,
  };
}
