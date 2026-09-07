type Props = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Appelé à la perte de focus pour enregistrer le titre. */
  onCommit: () => void;
  /** Appelé après Entrée, une fois le champ quitté. */
  onEnter: () => void;
};

export function PageTitleInput({
  value,
  disabled,
  onChange,
  onCommit,
  onEnter,
}: Props) {
  return (
    <textarea
      aria-label="Titre de la page"
      className="page-title"
      disabled={disabled}
      maxLength={300}
      onBlur={onCommit}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
          onEnter();
        }
      }}
      placeholder="Sans titre"
      ref={(node) => {
        if (node) {
          node.style.height = "auto";
          node.style.height = `${node.scrollHeight}px`;
        }
      }}
      rows={1}
      value={value}
    />
  );
}
