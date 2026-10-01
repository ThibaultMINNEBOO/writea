import {
  CompassIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  type LucideIcon,
  MonitorDownIcon,
  ShareIcon,
  SquarePlusIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { detectInstallPlatform, type InstallPlatform, useInstallPrompt } from "./install-prompt";

type Step = { icon: LucideIcon; text: string };

const instructions: Record<InstallPlatform, { intro: string; steps: Step[] }> = {
  ios: {
    intro: "Sur iPhone et iPad, l'installation se fait depuis Safari.",
    steps: [
      { icon: ShareIcon, text: "Touchez le bouton Partager en bas de l'écran." },
      { icon: SquarePlusIcon, text: "Choisissez « Sur l'écran d'accueil », puis « Ajouter »." },
    ],
  },
  "safari-mac": {
    intro: "Safari installe Writea comme une application du Dock.",
    steps: [
      { icon: CompassIcon, text: "Ouvrez le menu Fichier de Safari." },
      { icon: SquarePlusIcon, text: "Choisissez « Ajouter au Dock », puis « Ajouter »." },
    ],
  },
  firefox: {
    intro: "Firefox ne sait pas encore installer d'application web sur ordinateur.",
    steps: [
      { icon: EllipsisVerticalIcon, text: "Sur Android, ouvrez le menu ⋮ puis « Installer »." },
      {
        icon: MonitorDownIcon,
        text: "Sur ordinateur, ouvrez Writea dans Chrome ou Edge pour l'installer.",
      },
    ],
  },
  other: {
    intro: "Votre navigateur propose l'installation depuis son menu.",
    steps: [
      {
        icon: MonitorDownIcon,
        text: "Cliquez sur l'icône d'installation à droite de la barre d'adresse…",
      },
      {
        icon: EllipsisVerticalIcon,
        text: "…ou ouvrez le menu ⋮ du navigateur et choisissez « Installer Writea ».",
      },
    ],
  },
};

export function InstallAppButton({ className }: { className?: string }) {
  const { canPrompt, isInstalled, install } = useInstallPrompt();
  const [helpOpen, setHelpOpen] = useState(false);

  if (isInstalled) return null;

  const { intro, steps } = instructions[detectInstallPlatform()];

  async function handleClick() {
    if (!canPrompt) {
      setHelpOpen(true);
      return;
    }
    if (await install()) toast.success("Writea est installée sur votre appareil");
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleClick()}
        className={cn("gap-1.5", className)}
      >
        <DownloadIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="sr-only sm:hidden">Installer l'application</span>
      </Button>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Installer Writea</DialogTitle>
            <DialogDescription>
              {intro} Vous retrouverez vos manuscrits en un geste, même hors ligne.
            </DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3">
            {steps.map(({ icon: Icon, text }, index) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <span>
                  <span className="mr-1 font-heading font-semibold">{index + 1}.</span>
                  {text}
                </span>
              </li>
            ))}
          </ol>
          <DialogFooter>
            <Button onClick={() => setHelpOpen(false)}>Compris</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
