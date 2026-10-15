import { useEffect, useState } from "react"

// Demos show the phone composition a product would use below 700px.
export function useNarrow() {
  const query = "(max-width: 699px)"
  const [narrow, setNarrow] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const media = matchMedia(query)
    const update = () => setNarrow(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return narrow
}
