import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormInput } from "@/components/form-input";
import { Button } from "@/components/ui/button";

export function PasswordInput(props: ComponentProps<typeof FormInput>) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="auth-password">
      <FormInput {...props} id={id} type={visible ? "text" : "password"} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="auth-password-toggle"
        aria-label={
          visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        aria-controls={id}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </Button>
    </div>
  );
}
