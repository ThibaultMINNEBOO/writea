import { useState } from "react";
import { useMediaQuery } from "./use-media-query";
import { usePersistedState } from "./use-persisted-state";

export function useResponsivePanel(storageKey: string, dockedQuery: string) {
  const docked = useMediaQuery(dockedQuery);
  const [dockedOpen, setDockedOpen] = usePersistedState(storageKey, true);
  const [overlayOpen, setOverlayOpen] = useState(false);

  return docked
    ? { docked, open: dockedOpen, setOpen: setDockedOpen }
    : { docked, open: overlayOpen, setOpen: setOverlayOpen };
}
