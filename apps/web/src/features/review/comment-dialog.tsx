import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useAddReviewComment } from "./queries";
import type { TextOffsets } from "./text-range";

export type CommentDraft = TextOffsets & { quote: string };

type Props = {
  token: string;
  draft: CommentDraft | null;
  onClose(): void;
};

export function CommentDialog({ token, draft, onClose }: Props) {
  const [reviewerName, setReviewerName] = usePersistedState("writea:reviewer", "");
  const [body, setBody] = useState("");
  const addComment = useAddReviewComment(token);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    addComment.mutate(
      {
        reviewerName,
        body,
        quote: draft.quote,
        startOffset: draft.start,
        endOffset: draft.end,
      },
      {
        onSuccess: () => {
          setBody("");
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Laisser un commentaire</DialogTitle>
            <DialogDescription>
              {draft?.quote ? (
                <span className="line-clamp-3 border-l-2 pl-3 font-serif italic">
                  {draft.quote}
                </span>
              ) : (
                "Une remarque générale sur ce chapitre."
              )}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reviewer-name">Votre nom</FieldLabel>
              <Input
                id="reviewer-name"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field data-invalid={addComment.isError}>
              <FieldLabel htmlFor="comment-body">Commentaire</FieldLabel>
              <Textarea
                id="comment-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={4}
                required
                autoFocus
              />
              {addComment.error && <FieldError>{addComment.error.message}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={addComment.isPending}>
              {addComment.isPending && <Spinner data-icon="inline-start" />}
              Publier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
