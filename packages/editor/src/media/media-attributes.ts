export function mediaAttributes() {
  return Object.fromEntries(
    Object.entries({
      caption: "",
      alignment: "center",
      name: "",
      size: null,
      description: "",
    }).map(([name, value]) => [
      name,
      {
        default: value,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute(`data-${name}`);
          return name === "size" ? (raw ? Number(raw) : null) : (raw ?? value);
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          [`data-${name}`]: attrs[name],
        }),
      },
    ]),
  );
}
