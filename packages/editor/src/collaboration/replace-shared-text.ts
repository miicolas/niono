import type { Text } from "yjs";

export function replaceSharedText(text: Text, value: string) {
  const previous = text.toString();
  let start = 0;
  while (
    start < previous.length &&
    start < value.length &&
    previous[start] === value[start]
  )
    start++;
  let end = 0;
  while (
    end < previous.length - start &&
    end < value.length - start &&
    previous[previous.length - end - 1] === value[value.length - end - 1]
  )
    end++;
  text.doc!.transact(() => {
    if (previous.length - start - end)
      text.delete(start, previous.length - start - end);
    if (value.length - start - end)
      text.insert(start, value.slice(start, value.length - end));
  });
}
