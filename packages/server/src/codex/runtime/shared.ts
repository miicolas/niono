import { z } from "zod";
import type { DynamicToolCallParams } from "../protocol/v2/DynamicToolCallParams";
import { CodexRuntime } from "./codex-runtime";

export const CODEX_VERSION = "0.153.4";

export const disabled = [
  "shell_tool",
  "unified_exec",
  "shell_snapshot",
  "apps",
  "plugins",
  "hooks",
  "browser_use",
  "browser_use_external",
  "computer_use",
  "in_app_browser",
  "in_app_chat",
  "in_app_local_automation",
  "image_generation",
  "view_image",
  "multi_agent",
  "multi_agent_v2",
  "memories",
  "workspace_dependencies",
  "remote_plugin",
  "code_mode",
  "code_mode_host",
  "skill_search",
  "skill_mcp_dependency_install",
  "tool_suggest",
  "sleep_tool",
  "goals",
];

export const runtimeConfig = `cli_auth_credentials_store = "file"\nweb_search = "disabled"\nproject_doc_max_bytes = 0\ncheck_for_update_on_startup = false\n[features]\n${disabled.map((key) => `${key} = false`).join("\n")}\nskip_host_skill_discovery = true\n[analytics]\nenabled = false\n`;

export type RuntimeEvent = { method: string; params: Record<string, unknown> };

export const wire = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
});

export type ToolHandler = (params: DynamicToolCallParams) => Promise<unknown>;

export const runtimes = new Map<string, Promise<CodexRuntime>>();
