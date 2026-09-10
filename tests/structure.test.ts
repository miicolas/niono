import { expect, test } from "vitest";
import { checkSourceFile } from "../scripts/structure/check-source-file";

test("la limite compte les lignes physiques, y compris avec CRLF", () => {
  expect(checkSourceFile("theme.css", "/* règle */\r\n".repeat(300))).toEqual(
    [],
  );
  expect(checkSourceFile("theme.css", "/* règle */\n".repeat(301))).toEqual([
    "theme.css: 301 lignes (maximum 300).",
  ]);
  expect(checkSourceFile("empty.ts", "")).toEqual([]);
});

test("deux fonctions autonomes sont refusées, même sous un wrapper React", () => {
  expect(
    checkSourceFile(
      "actions.ts",
      "export function save() {}\nconst load = () => {};",
    ),
  ).toHaveLength(1);
  expect(
    checkSourceFile(
      "views.tsx",
      "const A = memo(() => null);\nconst B = React.forwardRef(() => null);",
    ),
  ).toHaveLength(1);
  expect(
    checkSourceFile("actions.ts", "const save = () => {}, load = () => {}; "),
  ).toHaveLength(1);
});

test("les callbacks capturant l’état restent dans leur fonction", () => {
  expect(
    checkSourceFile(
      "view.tsx",
      "export function View() { const click = () => {}; return items.map(item => item.name); }",
    ),
  ).toEqual([]);
  expect(
    checkSourceFile(
      "index.ts",
      'export { save } from "./save";\nexport { load } from "./load";',
    ),
  ).toEqual([]);
  expect(
    checkSourceFile(
      "runtime.ts",
      "export class Runtime { start() {} stop() {} }",
    ),
  ).toEqual([]);
});
