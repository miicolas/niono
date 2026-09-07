import { useBlocker } from "@tanstack/react-router";
import { type MutableRefObject, useRef } from "react";
/** Set by the open page: resolves to false when the user refuses to leave unsaved work. */
export type BeforeLeave = MutableRefObject<
  null | ((requireSaved?: boolean) => Promise<boolean>)
>;
export function useLeaveGuard(): BeforeLeave {
  const beforeLeave: BeforeLeave = useRef(null);
  useBlocker({
    enableBeforeUnload: false,
    shouldBlockFn: async ({ current, next }) => {
      if (
        current.routeId === "/(application)/" &&
        next.routeId === "/(application)/" &&
        current.search.p === next.search.p &&
        current.search.w === next.search.w
      ) {
        return false;
      }
      return beforeLeave.current ? !(await beforeLeave.current()) : false;
    },
  });
  return beforeLeave;
}
