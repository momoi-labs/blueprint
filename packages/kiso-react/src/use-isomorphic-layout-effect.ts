import * as React from "react"

/* `useLayoutEffect` warns when it runs on the server, where there is no DOM to
   measure. Internal: not exported from the package. */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
