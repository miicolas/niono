import { createElement as h } from "react";
import { vi } from "vitest";
import { AppSidebar } from "../../../apps/web/src/components/app-sidebar";
import { CodexProvider } from "../../../apps/web/src/features/codex/codex-context";
import { Input } from "../../../apps/web/src/components/ui/input";
import { Navigation } from "./navigation";

export function SearchNavigation() {
  const now = new Date("2026-09-06T00:00:00Z");
  return h(
    Navigation,
    null,
    h(CodexProvider, {
      children: h(AppSidebar, {
        pages: [],
        currentId: null,
        workspaceId: "workspace",
        bootstrap: {
          workspaceId: "workspace",
          user: {
            id: "user",
            name: "Atelier",
            email: "atelier@example.test",
            emailVerified: true,
            image: null,
            createdAt: now,
            updatedAt: now,
          },
          workspaces: [
            { id: "workspace", name: "Atelier", icon: "", role: "owner" },
          ],
        },
        onNavigate: vi.fn(),
        onCreate: vi.fn(),
        onWorkspace: vi.fn(),
        onNewWorkspace: vi.fn(),
        onAction: vi.fn(),
        onMove: vi.fn(),
        onLogout: vi.fn(),
      }),
    }),
    h(Input, { "aria-label": "Titre" }),
  );
}
