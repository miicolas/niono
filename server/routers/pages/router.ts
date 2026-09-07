import {
  pagesCreateHandler,
  pagesDuplicateHandler,
  pagesFavoriteHandler,
  pagesMoveHandler,
  pagesReorderFavoritesHandler,
  pagesShareHandler,
  pagesTrashHandler,
  pagesUpdateHandler,
} from "./mutations";
import {
  pagesGetHandler,
  pagesListHandler,
  pagesPreviewMoveHandler,
  pagesRecentHandler,
  pagesSearchHandler,
} from "./queries";

export const pagesRouter = {
  list: pagesListHandler,
  get: pagesGetHandler,
  recent: pagesRecentHandler,
  search: pagesSearchHandler,
  previewMove: pagesPreviewMoveHandler,
  create: pagesCreateHandler,
  update: pagesUpdateHandler,
  move: pagesMoveHandler,
  trash: pagesTrashHandler,
  favorite: pagesFavoriteHandler,
  reorderFavorites: pagesReorderFavoritesHandler,
  duplicate: pagesDuplicateHandler,
  share: pagesShareHandler,
};
