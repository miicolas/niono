import { fetchViteEnv } from "nitro/vite/runtime";

/** Keep asset requests on the authenticated Start route, including image destinations. */
export default function assetRoute({ req }: { req: Request }) {
  return fetchViteEnv("ssr", req);
}
