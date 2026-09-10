import { z } from "zod";
import { idSchema } from "@digipm/contracts";

export const pageId = z.object({ id: idSchema });
