import { createElement as h, type ReactNode } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "../../../apps/web/src/components/ui/sidebar";
import { SidebarState } from "./sidebar-state";

export function Navigation({ children }: { children?: ReactNode }) {
  return h(SidebarProvider, null, h(SidebarTrigger), h(SidebarState), children);
}
