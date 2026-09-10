import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import type { DocumentEditorProps } from "./shared";
import { useEditorEditable } from "./use-editor-editable";
export function TaskItemView({
  node,
  editor,
  updateAttributes,
  TaskCheckbox,
}: NodeViewProps & { TaskCheckbox: DocumentEditorProps["Checkbox"] }) {
  const canEdit = useEditorEditable(editor);
  return (
    <NodeViewWrapper data-type="taskItem" data-checked={node.attrs.checked}>
      <span className="task-checkbox" contentEditable={false}>
        <TaskCheckbox
          aria-label={`Tâche : ${node.textContent || "sans titre"}`}
          checked={node.attrs.checked === true}
          disabled={!canEdit}
          onCheckedChange={(checked) => {
            if (editor.isEditable)
              updateAttributes({ checked: checked === true });
          }}
        />
      </span>
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
