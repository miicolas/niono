import { render } from "@react-email/components";
import type { ReactElement } from "react";

/** Rend un template React Email en HTML et en texte brut de repli. */
export async function renderEmail(element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
