import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { questionnaireSchema } from "@digipm/contracts/questionnaire";
import type { DocumentEditorProps } from "./shared";
import { useEditorEditable } from "./use-editor-editable";
export function QuestionnaireNodeView({
  node,
  editor,
  updateAttributes,
  QuestionnaireSection,
}: NodeViewProps & {
  QuestionnaireSection: DocumentEditorProps["QuestionnaireSection"];
}) {
  const canEdit = useEditorEditable(editor);
  const result = questionnaireSchema.safeParse(node.attrs.questionnaire);
  return (
    <NodeViewWrapper
      contentEditable={false}
      className="page-questionnaire-node"
    >
      {result.success && QuestionnaireSection ? (
        <QuestionnaireSection
          value={result.data}
          editable={canEdit}
          onChange={(value) => {
            if (editor.isEditable) updateAttributes({ questionnaire: value });
          }}
        />
      ) : (
        <p>Questionnaire indisponible.</p>
      )}
    </NodeViewWrapper>
  );
}
