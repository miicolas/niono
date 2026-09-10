import { useCodex } from "@/features/codex/codex-context";
import { useState, useMemo } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSidebar } from "@/components/ui/sidebar";
import { useUI } from "@/lib/ui-store";
import type { PageItem } from "@/features/workspace/types";
import { canEditWorkspace } from "@digipm/server/permissions";
import { type Props, SEARCH_HOTKEY } from "./shared";

export function useAppSidebar(props: Props) {
  const codex = useCodex();
  const storePanel = useUI((s) => s.setPanel);
  const { setOpenMobile } = useSidebar();
  const setPanel = (panel: Parameters<typeof storePanel>[0]) => {
    storePanel(panel);
    setOpenMobile(false);
  };
  useHotkey(SEARCH_HOTKEY, () => setPanel("search"), {
    ignoreInputs: false,
    requireReset: true,
  });
  const navigate = (id: string | null) => {
    props.onNavigate(id);
    setOpenMobile(false);
  };
  const [newWorkspace, setNewWorkspace] = useState(false);
  const workspace = props.bootstrap.workspaces.find(
    (w) => w.id === props.workspaceId,
  );
  const isViewer = !canEditWorkspace(workspace?.role);
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, PageItem[]>();
    for (const page of props.pages) {
      const siblings = map.get(page.parentId) ?? [];
      siblings.push(page);
      map.set(page.parentId, siblings);
    }
    return map;
  }, [props.pages]);
  const roots = childrenByParent.get(null) ?? [];
  const favorites = props.pages
    .filter((p) => p.favorite)
    .sort((a, b) => (a.favoritePosition ?? 0) - (b.favoritePosition ?? 0));
  return {
    workspace,
    props,
    setOpenMobile,
    setNewWorkspace,
    setPanel,
    navigate,
    codex,
    favorites,
    isViewer,
    roots,
    childrenByParent,
    newWorkspace,
  };
}
