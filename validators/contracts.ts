// Barrel temporaire : les imports doivent migrer vers les modules ciblés.
export { MAX_ARCHIVE_BYTES, MAX_RPC_BODY_BYTES } from "@/constants/limits";
export {
  filterOperatorsFor,
  isChoiceType,
  isMultiValued,
} from "@/lib/databases/property-kinds";
export { validatePropertyValue } from "@/lib/databases/validate-property-value";
export type { DocumentNode } from "@/lib/editor/document-node";
export { documentText } from "@/lib/editor/document-text";
export { emptyDocument } from "@/lib/editor/empty-document";
export { safeUrl } from "@/lib/editor/safe-url";
export { validateDocument } from "@/lib/editor/validate-document";
export { idSchema, roleSchema } from "./common";
export {
  defaultViewConfig,
  type FilterOperator,
  type PropertyOption,
  type PropertyType,
  type PropertyValue,
  propertyOptionSchema,
  propertyTypeSchema,
  propertyValueSchema,
  type ViewConfig,
  viewSchema,
} from "./databases";
export { documentSchema } from "./documents";
export { type Archive, archiveSchema, emptyArchive } from "./transfer";
