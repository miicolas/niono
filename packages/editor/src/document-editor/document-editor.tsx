import { EditorUploadStatus } from "../media/editor-upload-status";
import { EditorMentionMenu } from "../mentions/editor-mention-menu";
import { EditorLinkTools } from "../links/editor-link-tools";
import { EditorUIContext } from "./editor-ui";
import { EditorContent } from "@tiptap/react";
import { type DocumentEditorProps } from "./shared";
import { useDocumentEditor } from "./use-document-editor";
import { EditorHistory } from "./editor-history";
import { EditorBlockHandle } from "./editor-block-handle";
import { EditorBubble } from "./editor-bubble";
import { EditorSlashMenu } from "./editor-slash-menu";
import { EditorBlockMenu } from "./editor-block-menu";
import { EditorTableTools } from "./editor-table-tools";
import { EditorAssistant } from "./editor-assistant";

export function DocumentEditor(props: DocumentEditorProps) {
  const {
    Input,
    uploadInput,
    upload,
    uploads,
    mentions,
    links,
    editable,
    editorState,
    editor,
    nodePos,
    setBlockMenu,
    askAI,
    onCodex,
    codexIcon,
    aiAvailable,
    setLink,
    setColors,
    colors,
    link,
    onError,
    slash,
    filtered,
    selected,
    setSelected,
    run,
    blockMenu,
    blockAction,
    ai,
    AssistantDialog,
    setAI,
    onAI,
  } = useDocumentEditor(props);
  if (!editor)
    return <div className="editor-loading">Ouverture de votre page…</div>;
  return (
    <EditorUIContext value={props.ui}>
      <div className="editor-container">
        <Input
          ref={uploadInput}
          type="file"
          hidden
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void upload(files);
            e.target.value = "";
          }}
        />
        <EditorHistory
          editable={editable}
          editorState={editorState}
          editor={editor}
        />
        <EditorContent editor={editor} />
        {editable && (
          <>
            <EditorUploadStatus uploads={uploads} />
            <EditorMentionMenu mentions={mentions} />
            <EditorLinkTools links={links} />
          </>
        )}
        <EditorBlockHandle
          editable={editable}
          editor={editor}
          nodePos={nodePos}
          setBlockMenu={setBlockMenu}
        />
        <EditorBubble
          editable={editable}
          editor={editor}
          askAI={askAI}
          onCodex={onCodex}
          codexIcon={codexIcon}
          aiAvailable={aiAvailable}
          editorState={editorState}
          setLink={setLink}
          setColors={setColors}
          colors={colors}
          link={link}
          blockMenu={blockMenu}
          onError={onError}
          Input={Input}
        />
        <EditorSlashMenu
          slash={slash}
          filtered={filtered}
          selected={selected}
          setSelected={setSelected}
          run={run}
        />
        <EditorBlockMenu
          blockMenu={blockMenu}
          blockAction={blockAction}
          setBlockMenu={setBlockMenu}
          editor={editor}
        />
        <EditorTableTools
          editorState={editorState}
          editable={editable}
          editor={editor}
        />
        <EditorAssistant
          ai={ai}
          AssistantDialog={AssistantDialog}
          setAI={setAI}
          editor={editor}
          aiAvailable={aiAvailable}
          onAI={onAI}
          onError={onError}
          Input={Input}
        />
      </div>
    </EditorUIContext>
  );
}
