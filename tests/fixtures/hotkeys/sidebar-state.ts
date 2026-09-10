import { createElement as h } from "react";
import { useSidebar } from "../../../apps/web/src/components/ui/sidebar";

export function SidebarState() {
  const { state, openMobile } = useSidebar();
  return h("output", { "aria-label": "Navigation" }, `${state}/${openMobile}`);
}
