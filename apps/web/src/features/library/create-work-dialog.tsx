import { PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { useCreateWork } from "./queries";

const read = (form: FormData, name: string) => String(form.get(name) ?? "");

export function CreateWorkDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const createWork = useCreateWork();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createWork.mutate(
      {
        title: read(form, "title"),
        subtitle: read(form, "subtitle"),
        author: read(form, "author"),
        synopsis: read(form, "synopsis"),
      },
      {
        onSuccess: (work) => {
          setOpen(false);
          navigate(`/oeuvres/${work.id}`);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Nouvelle œuvre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Commencer une nouvelle œuvre</DialogTitle>
            <DialogDescription>
              Un titre suffit pour démarrer, vous pourrez tout modifier plus tard.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={createWork.isError}>
              <FieldLabel htmlFor="title">Titre</FieldLabel>
              <Input id="title" name="title" required autoFocus />
              {createWork.error && <FieldError>{createWork.error.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="subtitle">Sous-titre</FieldLabel>
              <Input id="subtitle" name="subtitle" />
            </Field>
            <Field>
              <FieldLabel htmlFor="author">Auteur</FieldLabel>
              <Input id="author" name="author" defaultValue={session?.user.name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="synopsis">Synopsis</FieldLabel>
              <Textarea id="synopsis" name="synopsis" rows={3} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createWork.isPending}>
              {createWork.isPending && <Spinner data-icon="inline-start" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
