import { transferImportHandler } from "./mutations";
import { transferExportHandler } from "./queries";

export const transferRouter = {
  export: transferExportHandler,
  import: transferImportHandler,
};
