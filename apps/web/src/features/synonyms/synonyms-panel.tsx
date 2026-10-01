import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { api, unwrap } from "@/lib/api";

type Props = {
  initialTerm: string;
  onPick(synonym: string): void;
};

export function SynonymsPanel({ initialTerm, onPick }: Props) {
  const [input, setInput] = useState(initialTerm);
  const [query, setQuery] = useState(initialTerm.trim());

  const { data, isFetching } = useQuery({
    queryKey: ["thesaurus", query.toLocaleLowerCase("fr")],
    queryFn: () => unwrap(api.thesaurus.$get({ query: { q: query } })),
    enabled: query.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input.trim());
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupInput
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Chercher un synonyme…"
            aria-label="Mot à rechercher"
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </form>

      {!query && (
        <p className="text-sm text-muted-foreground">
          Placez le curseur sur un mot puis appuyez sur <kbd className="font-mono">⌘⇧S</kbd>, ou
          saisissez un terme ci-dessus.
        </p>
      )}

      {query && isFetching && !data && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {data && data.entries.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Aucun synonyme</EmptyTitle>
            <EmptyDescription>
              Rien trouvé pour « {data.query} ». Essayez une autre forme du mot.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {data && data.entries.length > 0 && (
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pb-4">
          {data.entries.map((entry) =>
            entry.meanings.map((meaning) => (
              <section key={meaning.id} className="flex flex-col gap-2">
                <h3 className="text-sm">
                  <span className="font-heading font-semibold">{entry.word}</span>
                  {meaning.partOfSpeech && (
                    <span className="ml-2 text-xs text-muted-foreground italic">
                      {meaning.partOfSpeech}
                    </span>
                  )}
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {meaning.synonyms.map((synonym) => (
                    <li key={synonym}>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onPick(synonym)}
                        title={`Remplacer par « ${synonym} »`}
                      >
                        {synonym}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )),
          )}
        </div>
      )}
    </div>
  );
}
