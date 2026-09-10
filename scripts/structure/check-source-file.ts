import ts from "typescript";
import { isModuleFunction } from "./is-module-function";
import { maximumLines } from "./policy";

export function checkSourceFile(file: string, source: string): string[] {
  const errors: string[] = [];
  const normalized = source.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const lines = normalized ? normalized.split("\n").length : 0;
  if (lines > maximumLines)
    errors.push(`${file}: ${lines} lignes (maximum ${maximumLines}).`);
  if (!/\.[cm]?[jt]sx?$/.test(file)) return errors;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const declarations = ast.statements.flatMap<ts.Node>((statement) =>
    ts.isVariableStatement(statement)
      ? [...statement.declarationList.declarations]
      : [statement],
  );
  const functions = declarations.filter(isModuleFunction);
  if (functions.length > 1) {
    const names = functions.map((node) =>
      "name" in node && node.name
        ? (node.name as ts.Node).getText(ast)
        : "default",
    );
    errors.push(
      `${file}: une fonction autonome par fichier (${names.join(", ")}).`,
    );
  }
  return errors;
}
