import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Importer ce module en première ligne d'un test d'interface pour disposer du DOM.
if (!GlobalRegistrator.isRegistered) {
  GlobalRegistrator.register();
}
