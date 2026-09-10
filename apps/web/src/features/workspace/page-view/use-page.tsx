import { listWorkspacePeople } from "@/lib/organization";
import { useCodex } from "../../codex/codex-context";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { download } from "@/lib/download";
import type { Editor } from "@digipm/editor";
import { client } from "@/lib/api";
import { useCollaborativeDocument } from "../../realtime/use-collaborative-document";
import { reportError } from "@/lib/notifications";
import { type Props } from "./shared";

export function usePage({
  data,
  onReload,
  ...props
}: Props & {
  data: Awaited<ReturnType<typeof client.pages.get>>;
  onReload: () => Promise<void>;
}) {
  const { page, document, canEdit } = data;
  const codex = useCodex();
  const [codexApplying, setCodexApplying] = useState(false);
  const [metadata, setMetadata] = useState(page);
  const [fallbackTitle, setFallbackTitle] = useState(page.title);
  const [panel, setPanel] = useState<
    "none" | "history" | "share" | "icon" | "cover"
  >("none");
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [icon, setIcon] = useState(page.icon);
  const [leaveResolve, setLeaveResolve] = useState<
    ((value: boolean) => void) | null
  >(null);
  const save = useCollaborativeDocument(
    props.user,
    props.workspaceId,
    page.id,
    document.revision,
  );
  const title = save.title ?? fallbackTitle;
  const setTitle = save.setTitle;
  const versions = useQuery({
    queryKey: ["versions", page.id],
    queryFn: () => client.pages.versions({ id: page.id }),
    enabled: panel === "history",
  });
  const members = useQuery({
    queryKey: ["members", props.workspaceId],
    queryFn: () => listWorkspacePeople(props.workspaceId),
    enabled: panel === "share",
  });
  const cache = useQueryClient();
  const metadataRef = useRef(metadata);
  useEffect(() => {
    if (page.revision <= metadataRef.current.revision) return;
    const previous = metadataRef.current;
    metadataRef.current = page;
    setMetadata(page);
    setFallbackTitle((value) =>
      value === previous.title ? page.title : value,
    );
    setIcon(page.icon);
  }, [page]);
  const metadataQueue = useRef(Promise.resolve(true));
  const update = (
    changes: Partial<
      Pick<typeof page, "title" | "icon" | "cover" | "coverPosition">
    >,
  ) => {
    metadataQueue.current = metadataQueue.current.then(async () => {
      try {
        if (
          Object.entries(changes).every(
            ([key, value]) =>
              metadataRef.current[key as keyof typeof metadata] === value,
          )
        )
          return true;
        const result = await client.pages.update({
          id: page.id,
          expectedRevision: metadataRef.current.revision,
          ...changes,
        });
        metadataRef.current = result;
        setMetadata(result);
        await props.onRefresh();
        return true;
      } catch (e) {
        reportError(e);
        await cache.invalidateQueries({ queryKey: ["page", page.id] });
        return false;
      }
    });
    return metadataQueue.current;
  };
  useEffect(() => {
    props.beforeLeave.current = async (requireSaved) => {
      if (
        !save.ready &&
        title !== metadata.title &&
        !(await update({ title: title.trim() || "Sans titre" }))
      )
        return false;
      await save.flush();
      if (!save.dirty()) return true;
      if (requireSaved) {
        reportError(
          new Error(
            "Enregistrez ou résolvez le conflit avant de dupliquer cette page.",
          ),
        );
        return false;
      }
      return new Promise<boolean>((resolve) => setLeaveResolve(() => resolve));
    };
    return () => {
      props.beforeLeave.current = null;
    };
  });
  useEffect(() =>
    codex.register({
      pageId: page.id,
      prepare: async () => {
        if (save.draft)
          throw new Error(
            "Récupérez ou écartez votre brouillon avant de demander une modification.",
          );
        if (
          !save.ready &&
          title !== metadataRef.current.title &&
          !(await update({ title: title.trim() || "Sans titre" }))
        )
          throw new Error("Le titre n’a pas pu être enregistré.");
        await metadataQueue.current;
        await save.flush();
        if (save.dirty())
          throw new Error(
            "Enregistrez votre brouillon ou résolvez le conflit avant de continuer avec Codex.",
          );
        return save.revision();
      },
      apply: async (_proposal, _mode, commit) => {
        if (codexApplying)
          throw new Error("Une modification est déjà en cours.");
        const editor = editorRef.current;
        setCodexApplying(true);
        editor?.setEditable(false);
        try {
          await codex.editor.current?.prepare();
          await commit();
          await onReload();
        } finally {
          setCodexApplying(false);
          if (!editor?.isDestroyed) editor?.setEditable(canEdit);
        }
      },
    }),
  );
  const downloadDraft = () => {
    download(
      `${title || "page"}-brouillon.json`,
      JSON.stringify(
        save.latest() ?? editorRef.current?.getJSON() ?? document.content,
        null,
        2,
      ),
      "application/json",
    );
  };
  return {
    save,
    downloadDraft,
    canEdit,
    props,
    page,
    title,
    metadata,
    document,
    onReload,
    setPanel,
    editorRef,
    update,
    codexApplying,
    setTitle,
    codex,
    data,
    setHeadings,
    headings,
    panel,
    icon,
    fileInput,
    versions,
    setSelectedVersion,
    selectedVersion,
    cache,
    members,
    metadataRef,
    setMetadata,
    leaveResolve,
    setLeaveResolve,
  };
}
