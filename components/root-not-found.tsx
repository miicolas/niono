import { Link } from "@tanstack/react-router";

/** Page introuvable, rendue par la route racine. */
export function RootNotFound() {
  return (
    <div className="empty-state">
      <h1>Page introuvable</h1>
      <Link to="/">Retour à l’espace</Link>
    </div>
  );
}
