import ts from "typescript";

export function isModuleFunction(node: ts.Node): boolean {
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node))
    return true;
  if (!ts.isVariableDeclaration(node) || !node.initializer) return false;
  let value = node.initializer;
  while (
    ts.isParenthesizedExpression(value) ||
    ts.isAsExpression(value) ||
    ts.isSatisfiesExpression(value)
  )
    value = value.expression;
  if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) return true;
  // Components wrapped in memo/forwardRef still define a module function.
  return (
    ts.isCallExpression(value) &&
    /(?:^|\.)(memo|forwardRef)$/.test(value.expression.getText()) &&
    value.arguments.some(
      (argument) =>
        ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
    )
  );
}
