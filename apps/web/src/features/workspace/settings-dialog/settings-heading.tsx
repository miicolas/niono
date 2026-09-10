export function SettingsHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="settings-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}
