export function download(name: string, content: string | Blob, type: string) {
  const url = URL.createObjectURL(
    typeof content === "string" ? new Blob([content], { type }) : content
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[/\\]/g, "-");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
