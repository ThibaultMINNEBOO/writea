import { CopyIcon, Link2OffIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { reviewUrl, useRevokeShare, useShareVersion } from "./queries";

async function copyLink(token: string) {
  try {
    await navigator.clipboard.writeText(reviewUrl(token));
    toast.success("Lien de relecture copié", { description: reviewUrl(token) });
  } catch {
    toast.info("Lien de relecture", { description: reviewUrl(token) });
  }
}

type Props = { chapterId: string; version: { id: string; shareToken: string | null } };

export function ShareControls({ chapterId, version }: Props) {
  const share = useShareVersion(chapterId);
  const online = useOnlineStatus();
  const revoke = useRevokeShare(chapterId);

  if (!version.shareToken) {
    return (
      <Button
        variant="outline"
        size="xs"
        className="self-start"
        disabled={share.isPending || !online}
        onClick={() => share.mutate(version.id, { onSuccess: ({ token }) => copyLink(token) })}
      >
        {share.isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Share2Icon data-icon="inline-start" />
        )}
        Partager pour relecture
      </Button>
    );
  }

  const token = version.shareToken;
  return (
    <div className="flex gap-1">
      <Button variant="secondary" size="xs" onClick={() => copyLink(token)}>
        <CopyIcon data-icon="inline-start" />
        Copier le lien
      </Button>
      <Button
        variant="ghost"
        size="xs"
        disabled={revoke.isPending || !online}
        onClick={() =>
          revoke.mutate(version.id, { onSuccess: () => toast.success("Partage désactivé") })
        }
      >
        <Link2OffIcon data-icon="inline-start" />
        Arrêter le partage
      </Button>
    </div>
  );
}
