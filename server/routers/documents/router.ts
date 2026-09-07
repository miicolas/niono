import {
  documentsRestoreVersionHandler,
  documentsSaveHandler,
} from "./mutations";
import { documentsVersionsHandler } from "./queries";

export const documentsRouter = {
  versions: documentsVersionsHandler,
  save: documentsSaveHandler,
  restore: documentsRestoreVersionHandler,
};
