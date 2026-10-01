import {
  BookDownIcon,
  BookOpenTextIcon,
  type LucideIcon,
  MessagesSquareIcon,
  QuoteIcon,
  SparklesIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";

const features: { icon: LucideIcon; title: string; description: string; tone: string }[] = [
  {
    icon: SparklesIcon,
    title: "Une typographie qui vous ressemble",
    description: "Tirets de dialogue et guillemets « français » posés pendant que vous écrivez.",
    tone: "bg-cover-1/15 text-cover-1",
  },
  {
    icon: BookOpenTextIcon,
    title: "Le mot juste, à portée de main",
    description: "Un dictionnaire des synonymes intégré, sans quitter votre phrase.",
    tone: "bg-cover-2/15 text-cover-2",
  },
  {
    icon: MessagesSquareIcon,
    title: "Des relectures sans friction",
    description: "Partagez un chapitre par lien, vos lecteurs annotent directement le texte.",
    tone: "bg-cover-3/15 text-cover-3",
  },
  {
    icon: BookDownIcon,
    title: "Prêt pour la liseuse",
    description: "Exportez votre manuscrit en EPUB en un clic.",
    tone: "bg-cover-5/15 text-cover-5",
  },
];

export function AuthShowcase() {
  return (
    <aside className="bg-paper relative hidden flex-col justify-between gap-12 overflow-hidden border-r p-10 lg:flex">
      <Logo linked={false} />
      <div className="flex max-w-md flex-col gap-10">
        <figure className="flex flex-col gap-3">
          <QuoteIcon className="size-8 text-primary/60" />
          <blockquote className="font-heading text-3xl leading-snug font-medium">
            Vingt fois sur le métier remettez votre ouvrage.
          </blockquote>
          <figcaption className="text-sm text-muted-foreground">Nicolas Boileau, 1674</figcaption>
        </figure>
        <ul className="flex flex-col gap-5">
          {features.map(({ icon: Icon, title, description, tone }) => (
            <li key={title} className="flex gap-3">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
                <Icon className="size-4.5" />
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{title}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Écrit en France, pour les plumes francophones.
      </p>
    </aside>
  );
}
