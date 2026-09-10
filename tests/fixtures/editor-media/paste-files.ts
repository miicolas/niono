import { fireEvent } from "@testing-library/react";

export function pasteFiles(target: Element, files: File[]) {
  return fireEvent.paste(target, {
    clipboardData: { files, getData: () => "" },
  });
}
