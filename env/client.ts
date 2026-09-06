import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const clientEnv = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_REACT_QUERY_DEVTOOLS: z.enum(["true", "false"]).optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
