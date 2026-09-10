import { QuestionnaireNodeView } from "./questionnaire-node-view";
import { TaskItemView } from "./task-item-view";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration, { isChangeOrigin } from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { MediaImage } from "../media/media-image";
import { BookmarkNode } from "../media/bookmark-node";
import { MentionNode } from "../mentions/mention-node";
import { MediaNodeView } from "../media/media-node-view";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import UniqueID from "@tiptap/extension-unique-id";
import {
  Details,
  DetailsSummary,
  DetailsContent,
} from "@tiptap/extension-details";
import { QuestionnaireNode } from "../questionnaire-node";
import { Callout, FileNode, PageLink } from "../extensions";
import { type DocumentEditorProps } from "./shared";

export function createEditorExtensions({
  editable,
  TaskCheckbox,
  QuestionnaireSection,
  collaboration,
  onUpload,
}: {
  onUpload: DocumentEditorProps["onUpload"];
  editable: boolean;
  TaskCheckbox: DocumentEditorProps["Checkbox"];
  QuestionnaireSection: DocumentEditorProps["QuestionnaireSection"];
  collaboration?: DocumentEditorProps["collaboration"];
}) {
  return [
    StarterKit.configure({
      undoRedo: collaboration ? false : undefined,
      link: {
        openOnClick: !editable,
        defaultProtocol: "https",
        protocols: ["https", "http", "mailto"],
      },
    }),
    ...(collaboration
      ? [
          Collaboration.configure({ document: collaboration.document }),
          CollaborationCaret.configure({
            provider: collaboration,
            user: { ...collaboration.user, color: "#2563eb" },
          }),
        ]
      : []),
    TaskList,
    TaskItem.extend({
      addNodeView() {
        return ReactNodeViewRenderer(
          (props) => <TaskItemView {...props} TaskCheckbox={TaskCheckbox} />,
          { as: "li" },
        );
      },
    }).configure({
      nested: true,
      a11y: {
        checkboxLabel: (node) => `Tâche : ${node.textContent || "sans titre"}`,
      },
    }),
    ...[MediaImage, FileNode, BookmarkNode].map((extension) =>
      extension.extend({
        addNodeView() {
          return ReactNodeViewRenderer((props) => (
            <MediaNodeView {...props} onUpload={onUpload} />
          ));
        },
      }),
    ),
    MentionNode,
    TableKit.configure({ table: { resizable: true } }),
    Placeholder.configure({
      placeholder: "Écrivez quelque chose, ou « / » pour les commandes…",
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Subscript,
    Superscript,
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    Callout,
    PageLink,
    QuestionnaireNode.extend({
      addNodeView() {
        return ReactNodeViewRenderer((props) => (
          <QuestionnaireNodeView
            {...props}
            QuestionnaireSection={QuestionnaireSection}
          />
        ));
      },
    }),
    UniqueID.configure({
      filterTransaction: collaboration
        ? (transaction) => !isChangeOrigin(transaction)
        : null,
      types: [
        "paragraph",
        "heading",
        "blockquote",
        "codeBlock",
        "image",
        "table",
        "taskItem",
        "listItem",
        "callout",
        "details",
        "file",
        "bookmark",
        "questionnaire",
      ],
    }),
  ];
}
