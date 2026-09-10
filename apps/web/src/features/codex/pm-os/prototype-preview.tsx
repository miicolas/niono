export function PrototypePreview({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  const policy =
    "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'";
  const source =
    '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="' +
    policy +
    '"><meta name="referrer" content="no-referrer"></head><body>' +
    html +
    "</body></html>";
  return (
    <iframe
      className="pm-prototype"
      title={"Prototype : " + title}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={source}
    />
  );
}
