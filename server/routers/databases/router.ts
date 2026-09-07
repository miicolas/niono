import {
  databasesAddEntryHandler,
  databasesAddPropertyHandler,
  databasesSaveViewHandler,
  databasesUpdateCellHandler,
} from "./mutations";
import { databasesGetHandler, databasesQueryHandler } from "./queries";

export const databasesRouter = {
  get: databasesGetHandler,
  query: databasesQueryHandler,
  addEntry: databasesAddEntryHandler,
  addProperty: databasesAddPropertyHandler,
  saveView: databasesSaveViewHandler,
  updateCell: databasesUpdateCellHandler,
};
