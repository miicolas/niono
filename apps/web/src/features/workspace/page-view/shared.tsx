import { lazy, type MutableRefObject } from "react";
import { client } from "@/lib/api";
import type { Bootstrap, PageItem } from "../types";
import { usePage } from "./use-page";

export const DocumentEditor = lazy(() =>
  import("@digipm/editor").then((m) => ({ default: m.DocumentEditor })),
);

export const DatabaseView = lazy(() =>
  import("@/features/database/database-view").then((m) => ({
    default: m.DatabaseView,
  })),
);

export type Props = {
  pageId: string;
  workspaceId: string;
  user: Bootstrap["user"];
  pages: PageItem[];
  onRefresh: () => Promise<void>;
  onNavigate: (id: string) => void;
  onHome: () => void;
  beforeLeave: MutableRefObject<
    null | ((requireSaved?: boolean) => Promise<boolean>)
  >;
  onAction: (action: string) => void;
};

export type LoadedPageProps = Props & {
  data: Awaited<ReturnType<typeof client.pages.get>>;
  onReload: () => Promise<void>;
};

export type PageState = ReturnType<typeof usePage>;
