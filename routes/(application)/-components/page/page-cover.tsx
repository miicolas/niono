type Props = {
  cover: string;
  coverPosition: number;
  canEdit: boolean;
  onChange: () => void;
  onRemove: () => void;
};

export function PageCover({
  cover,
  coverPosition,
  canEdit,
  onChange,
  onRemove,
}: Props) {
  return (
    <div className="document-cover">
      <img
        alt="Couverture de la page"
        src={cover}
        style={{ objectPosition: `50% ${coverPosition}%` }}
      />
      {canEdit && (
        <div className="cover-actions">
          <button onClick={onChange} type="button">
            Changer la couverture
          </button>
          <button onClick={onRemove} type="button">
            Retirer
          </button>
        </div>
      )}
    </div>
  );
}
