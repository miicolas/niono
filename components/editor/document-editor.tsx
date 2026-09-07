import {
  type Editor,
  EditorContent,
  type JSONContent,
  useEditor,
} from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import { IMAGE_ACCEPT } from "@/constants/image-types";
import type { UploadedAsset } from "@/lib/editor/upload-file";
import type { DocumentNode } from "@/validators/contracts";
import { AIPanel } from "./ai-panel";
import { runBlockAction } from "./block-actions";
import { BlockContextMenu } from "./block-context-menu";
import { BlockHandle } from "./block-handle";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { createEditorExtensions } from "./editor-extensions";
import type { EditorHandlers } from "./editor-handlers";
import { EditorHistoryTools } from "./editor-history-tools";
import { createEditorProps } from "./editor-props";
import { createSlashActions } from "./slash-actions";
import { SlashMenu } from "./slash-menu";
import { TableTools } from "./table-tools";
import { UploadInput } from "./upload-input";
import { useAIRewrite } from "./use-ai-rewrite";
import { useBlockMenu } from "./use-block-menu";
import { type EditorHeading, useEditorHeadings } from "./use-editor-headings";
import { useEditorUpload } from "./use-editor-upload";
import { useLatest } from "./use-latest";
import { useSlashCommand } from "./use-slash-command";

export type DocumentEditorProps = {
  content: DocumentNode;
  editable: boolean;
  onChange: (doc: DocumentNode) => void;
  onReady?: (editor: Editor) => void;
  onUpload: (file: File) => Promise<UploadedAsset>;
  onAI?: (text: string, instruction: string) => Promise<string>;
  aiAvailable?: boolean;
  onError?: (message: string) => void;
  onHeadings?: (headings: EditorHeading[]) => void;
};

const isAIShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j";

/** Éditeur de page Tiptap : contenu, menus, envoi de fichiers et assistant. */
export function DocumentEditor({
  content,
  editable,
  onChange,
  onReady,
  onUpload,
  onAI,
  aiAvailable,
  onError,
  onHeadings,
}: DocumentEditorProps) {
  const handlers = useRef<EditorHandlers | null>(null);
  const editorProps = useMemo(() => createEditorProps(handlers), []);
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable,
    content: content as JSONContent,
    extensions: createEditorExtensions(editable),
    editorProps,
    onUpdate: ({ editor: current }) => handlers.current?.onUpdate(current),
    onSelectionUpdate: ({ editor: current }) =>
      handlers.current?.onSelectionUpdate(current),
  });
  const files = useEditorUpload({ editor, editable, onUpload, onError });
  const slash = useSlashCommand(createSlashActions(files));
  const block = useBlockMenu();
  const ai = useAIRewrite({ editor, editable, onAI, onError });
  const ready = useLatest(onReady);
  useEffect(() => {
    if (editor) {
      ready.current?.(editor);
    }
  }, [editor, ready]);
  const publishHeadings = useEditorHeadings(editor, onHeadings);
  useEffect(() => {
    editor?.setEditable(editable, false);
  }, [editor, editable]);

  handlers.current = {
    onKeyDown: (event) => {
      if (event.key === "Escape") {
        slash.close();
        block.close();
        ai.close();
        return false;
      }
      if (isAIShortcut(event)) {
        event.preventDefault();
        ai.open();
        return true;
      }
      return editor ? slash.handleKeyDown(editor, event) : false;
    },
    onFiles: files.upload,
    onUpdate: (current) => {
      onChange(current.getJSON() as DocumentNode);
      slash.update(current);
      publishHeadings(current);
    },
    onSelectionUpdate: slash.update,
  };

  if (!editor) {
    return <div className="editor-loading">Ouverture de votre page…</div>;
  }
  return (
    <div className="editor-container">
      <UploadInput
        accept={IMAGE_ACCEPT}
        inputRef={files.imageInput}
        onFiles={files.upload}
      />
      <UploadInput inputRef={files.fileInput} onFiles={files.upload} />
      {editable && <EditorHistoryTools editor={editor} />}
      <EditorContent editor={editor} />
      {editable && (
        <BlockHandle
          editor={editor}
          nodePos={block.nodePos}
          onOpenMenu={block.open}
        />
      )}
      {editable && (
        <EditorBubbleMenu editor={editor} onAskAI={ai.open} onError={onError} />
      )}
      <SlashMenu editor={editor} slash={slash} />
      {block.menu && (
        <BlockContextMenu
          menuRef={block.menuRef}
          onAction={(kind) => {
            if (runBlockAction(editor, block.nodePos.current, kind)) {
              block.close();
            }
          }}
          position={block.menu}
        />
      )}
      {editable && <TableTools editor={editor} />}
      <AIPanel available={aiAvailable} rewrite={ai} />
    </div>
  );
}
