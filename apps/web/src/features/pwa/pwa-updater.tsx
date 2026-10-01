import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";
import { toast } from "sonner";

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

export function PwaUpdater() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.success("Writea est prêt à fonctionner hors ligne");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    toast("Une nouvelle version de Writea est disponible", {
      id: "pwa-update",
      duration: Number.POSITIVE_INFINITY,
      description: "Votre texte est enregistré, vous pouvez mettre à jour sans risque.",
      action: { label: "Mettre à jour", onClick: () => void updateServiceWorker(true) },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
