import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { MediaImage } from "../media/media-image";
import { BookmarkNode } from "../media/bookmark-node";
import { MentionNode } from "../mentions/mention-node";
import { TableKit } from "@tiptap/extension-table";
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

export const blockIdTypes = [
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
];

// The same schema extensions as DocumentEditor, without DOM plugins or React.
export const schema = getSchema([
  StarterKit,
  TaskList,
  TaskItem.configure({ nested: true }),
  MediaImage,
  BookmarkNode,
  MentionNode,
  TableKit,
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
  FileNode,
  PageLink,
  QuestionnaireNode,
  UniqueID.configure({ types: blockIdTypes }),
]);
