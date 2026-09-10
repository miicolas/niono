import { useRef } from "react";

/** Guard the asynchronous validation phase as well as the request itself. */
export function useFormSubmit(form: { handleSubmit: () => Promise<unknown> }) {
  const pending = useRef(false);
  return async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      await form.handleSubmit();
    } finally {
      pending.current = false;
    }
  };
}
