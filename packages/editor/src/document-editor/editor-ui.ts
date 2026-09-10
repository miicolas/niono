import {
  createContext,
  type ComponentType,
  type ComponentProps,
  type ReactNode,
} from "react";
export type MenuItem = {
  id: string;
  label: string;
  section?: string;
  shortcut?: string;
  description?: string;
  icon: ReactNode;
  onSelect: () => void;
};
export type EditorUI = {
  Button: ComponentType<ComponentProps<"button">>;
  Toggle: ComponentType<
    ComponentProps<"button"> & {
      pressed?: boolean;
      onPressedChange?: (pressed: boolean) => void;
    }
  >;
  Separator: ComponentType<{ orientation: "vertical"; className?: string }>;
  Spinner: ComponentType<{ className?: string }>;
  SlashMenu: ComponentType<{
    label?: string;
    heading?: string;
    empty?: string;
    x: number;
    y: number;
    items: MenuItem[];
    selected: string;
    onSelectedChange: (id: string) => void;
  }>;
  BlockMenu: ComponentType<{
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
    onRestoreFocus: () => void;
  }>;
  Popover: ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactNode;
    children: ReactNode;
    label: string;
    onRestoreFocus: () => void;
  }>;
  MediaForm: ComponentType<import("../media/media-types").MediaFormProps>;
  TextForm: ComponentType<{
    kind: "link" | "instruction";
    value: string;
    onSubmit: (value: string) => Promise<void> | void;
  }>;
};
export const EditorUIContext = createContext<EditorUI | null>(null);
