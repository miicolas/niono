import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { reportError } from "@/lib/ui/notifications";
import { useUI } from "@/lib/ui/store";
import type { Bootstrap } from "@/routes/(application)/-lib/types";
export function SettingsGeneralTab({ user }: { user: Bootstrap["user"] }) {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const sendVerification = async () => {
    try {
      const result = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/",
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success("Email de vérification envoyé");
    } catch (e) {
      reportError(e);
    }
  };
  return (
    <>
      <div className="settings-row">
        <div>
          Apparence<p>Un fond sombre ou une page de papier.</p>
        </div>
        <select
          aria-label="Apparence"
          onChange={(e) =>
            setTheme(e.target.value === "dark" ? "dark" : "light")
          }
          value={theme}
        >
          <option value="dark">Sombre</option>
          <option value="light">Papier</option>
        </select>
      </div>
      <div className="settings-row">
        <div>
          Votre compte<p>{user.email}</p>
        </div>
        {!user.emailVerified && (
          <Button onClick={sendVerification} size="sm" variant="outline">
            Vérifier mon email
          </Button>
        )}
      </div>
      <p className="muted text-xs">
        Les contenus sont enregistrés automatiquement. En cas de coupure, votre
        brouillon reste sur cet appareil.
      </p>
    </>
  );
}
