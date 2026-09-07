/** Correspondances entre identifiants d'origine et identifiants copiés lors d'une duplication. */
export type CopyMappings = {
  pages: Map<string, string>;
  assets: Map<string, string>;
  sources: Map<string, string>;
  properties: Map<string, string>;
};
