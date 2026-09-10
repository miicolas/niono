import type { EditorUI } from "@digipm/editor/document-editor/editor-ui";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { EditorButton } from "./controls/editor-button";
import { EditorBlockMenu } from "./controls/editor-block-menu";
import { EditorSlashMenu } from "./controls/editor-slash-menu";
import { EditorPopover } from "./controls/editor-popover";
import { EditorTextForm } from "./controls/editor-text-form";
import { EditorMediaForm } from "./controls/editor-media-form";
export const editorControls: EditorUI = {
  Button: EditorButton,
  Toggle,
  Separator,
  Spinner,
  BlockMenu: EditorBlockMenu,
  SlashMenu: EditorSlashMenu,
  Popover: EditorPopover,
  TextForm: EditorTextForm,
  MediaForm: EditorMediaForm,
};
