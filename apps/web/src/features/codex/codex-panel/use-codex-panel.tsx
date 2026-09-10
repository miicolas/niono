import { usePmPanel } from "../pm-os/use-pm-panel";
import { useFormSubmit } from "@/hooks/use-form-submit";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { client } from "@/lib/api";
import { useCodex, type Proposal } from "../codex-context";
import { type EventResult } from "./shared";

export function useCodexPanel({
  workspaceId,
  pageId,
  pageTitle,
  userId,
}: {
  workspaceId: string;
  pageId: string | null;
  pageTitle?: string;
  userId: string;
}) {
  const codex = useCodex();
  const mobile = useIsMobile();
  const cache = useQueryClient();
  const [id, setId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<EventResult | null>(null);
  const cursor = useRef<string | undefined>(undefined);
  const composer = useForm({
    defaultValues: { prompt: "" },
    validators: {
      onSubmit: z.object({
        prompt: z.string().trim().min(1, "Écrivez un message.").max(12000),
      }),
    },
    onSubmit: async () => {
      await submit();
    },
  });
  const submitComposer = useFormSubmit(composer);
  const prompt = useStore(composer.store, (state) => state.values.prompt);
  const setPrompt = (value: string) => composer.setFieldValue("prompt", value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const followOutput = useRef(true);
  const [awayFromEnd, setAwayFromEnd] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fillPrompt = (text: string) => {
    setPrompt(text);
    input.current?.focus();
  };
  const request = useRef<{ signature: string; requestId: string } | null>(null);
  const status = useQuery({
    queryKey: ["codex-status"],
    queryFn: () => client.codex.status(),
    enabled: codex.open,
    retry: false,
  });
  const list = useQuery({
    queryKey: ["codex-list", userId, workspaceId],
    queryFn: () => client.codex.list({ workspaceId }),
    enabled: codex.open,
    retry: false,
  });
  const eventQuery = useQuery({
    queryKey: ["codex-events", userId, workspaceId, id],
    queryFn: () =>
      client.codex.events({ conversationId: id!, after: cursor.current }),
    enabled: codex.open && !!id,
    refetchInterval: (query) =>
      ["running", "awaiting_input"].includes(
        query.state.data?.conversation.status ?? "",
      )
        ? 500
        : false,
    retry: false,
    gcTime: 0,
  });
  useEffect(() => {
    const data = eventQuery.data;
    if (!data) return;
    cursor.current = data.cursor;
    setSnapshot((previous) => ({
      ...data,
      messages: data.messages ?? previous?.messages ?? [],
      proposals: data.proposals ?? previous?.proposals ?? [],
    }));
    if (data.conversation.status !== "running")
      void cache.invalidateQueries({
        queryKey: ["codex-list", userId, workspaceId],
      });
  }, [eventQuery.data]);
  useEffect(() => {
    if (followOutput.current) end.current?.scrollIntoView({ block: "nearest" });
  }, [id, snapshot?.messages, snapshot?.proposals, snapshot?.pm]);
  useEffect(() => {
    if (codex.selection && codex.selection.pageId !== pageId)
      codex.setSelection(null);
  }, [pageId]);
  useEffect(() => {
    const field = input.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 200)}px`;
  }, [prompt, codex.open, status.data?.status, settingsOpen]);
  useEffect(() => {
    if (
      codex.open &&
      status.data?.status === "connected" &&
      !settingsOpen &&
      !mobile
    )
      input.current?.focus();
  }, [codex.open, status.data?.status, settingsOpen, mobile]);
  const select = (next: string | null) => {
    followOutput.current = true;
    setAwayFromEnd(false);
    cursor.current = undefined;
    setSnapshot(null);
    setId(next);
    setError(null);
    setDeleteOpen(false);
    request.current = null;
  };
  const running = ["running", "awaiting_input"].includes(
    snapshot?.conversation.status ?? "",
  );
  const pm = usePmPanel({
    workspaceId,
    pageId,
    userId,
    open: codex.open,
    id,
    snapshot,
    select,
    fillPrompt,
  });
  const execute = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (e) {
      setError(e instanceof Error ? e.message : "La demande a échoué.");
    } finally {
      setBusy(false);
    }
  };
  const submit = () => {
    if (!prompt.trim() || busy || running || eventQuery.error) return;
    return execute(async () => {
      if (pageId && codex.editor.current?.pageId === pageId)
        await codex.editor.current.prepare();
      const selection =
        codex.selection?.pageId === pageId ? codex.selection : null;
      const signature = JSON.stringify({ id, prompt, pageId, selection });
      const requestId =
        request.current?.signature === signature
          ? request.current.requestId
          : crypto.randomUUID();
      request.current = { signature, requestId };
      const response = await client.codex.send({
        workspaceId,
        conversationId: id ?? undefined,
        requestId,
        subjectId: id
          ? (snapshot?.conversation.pmSubjectId ?? undefined)
          : pm.context.data?.selectedSubjectId,
        prompt,
        pageId: pageId ?? undefined,
        selection: selection
          ? {
              from: selection.from,
              to: selection.to,
              text: selection.text,
              revision: selection.revision,
            }
          : undefined,
      });
      select(response.conversationId);
      setPrompt("");
      input.current?.focus();
      await cache.invalidateQueries({ queryKey: ["codex-events"] });
      await list.refetch();
    });
  };
  const decide = (
    proposal: Proposal,
    decision: "apply" | "reject",
    mode: "replace" | "insert" = "replace",
  ) =>
    execute(async () => {
      const commit = () =>
        client.codex.decide({
          conversationId: proposal.conversationId,
          proposalId: proposal.id,
          decision,
          mode,
        });
      const target =
        "pageId" in proposal.action ? proposal.action.pageId : null;
      if (decision === "apply" && codex.editor.current?.pageId === target)
        await codex.editor.current.apply(proposal, mode, commit);
      else await commit();
      await cache.invalidateQueries({
        predicate: (query) =>
          [
            "codex-events",
            "pages",
            "page",
            "database",
            "entries",
            "versions",
          ].includes(String(query.queryKey[0])),
      });
    });
  const blocked = !!eventQuery.error;
  const Panel = mobile ? Drawer : Sheet;
  const PanelContent = mobile ? DrawerContent : SheetContent;
  const PanelHeader = mobile ? DrawerHeader : SheetHeader;
  const PanelTitle = mobile ? DrawerTitle : SheetTitle;
  const PanelDescription = mobile ? DrawerDescription : SheetDescription;
  return {
    pm,
    Panel,
    codex,
    mobile,
    PanelContent,
    input,
    PanelHeader,
    PanelTitle,
    settingsOpen,
    setSettingsOpen,
    PanelDescription,
    id,
    select,
    busy,
    list,
    setPrompt,
    running,
    setDeleteOpen,
    deleteOpen,
    execute,
    status,
    scroll,
    followOutput,
    setAwayFromEnd,
    pageId,
    fillPrompt,
    snapshot,
    blocked,
    workspaceId,
    decide,
    error,
    eventQuery,
    end,
    awayFromEnd,
    submitComposer,
    pageTitle,
    composer,
    prompt,
  };
}
