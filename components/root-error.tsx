/** Écran d'erreur de dernier recours, rendu par la route racine. */
export function RootError() {
  return (
    <div className="empty-state" role="alert">
      <h1>Impossible d’afficher cette page</h1>
      <p>Rechargez l’espace pour retrouver vos contenus.</p>
      <button onClick={() => window.location.reload()} type="button">
        Recharger l’espace
      </button>
    </div>
  );
}
