import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api";
import type { EventResult } from "../codex-panel/shared";
export function usePmPanel({
  workspaceId,
  pageId,
  userId,
  open,
  id,
  snapshot,
  select,
  fillPrompt,
}: {
  workspaceId: string;
  pageId: string | null;
  userId: string;
  open: boolean;
  id: string | null;
  snapshot: EventResult | null;
  select: (id: string | null) => void;
  fillPrompt: (text: string) => void;
}) {
  const cache = useQueryClient();
  const [override, setOverride] = useState<string | null | undefined>(
    undefined,
  );
  useEffect(() => {
    setOverride(undefined);
  }, [workspaceId, pageId]);
  const subjectId =
    id && snapshot?.conversation.pmPackVersion
      ? snapshot.conversation.pmSubjectId
      : override;
  const context = useQuery({
    queryKey: ["pm-context", userId, workspaceId, pageId, subjectId],
    queryFn: () => client.pm.context({ workspaceId, pageId, subjectId }),
    enabled: open,
    retry: false,
  });
  const refresh = async () => {
    await cache.invalidateQueries({
      predicate: (query) =>
        ["pm-context", "pages"].includes(String(query.queryKey[0])),
    });
  };
  const changeSubject = (id: string | null) => {
    setOverride(id);
    select(null);
  };
  const chooseWorkflow = (workflow: string) => {
    if (id && !snapshot?.conversation.pmPackVersion) select(null);
    fillPrompt("/" + workflow + " ");
  };
  return { context, refresh, changeSubject, chooseWorkflow };
}
