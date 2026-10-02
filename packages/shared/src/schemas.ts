import { z } from "zod";

const title = z.string().trim().min(1, "Le titre est requis").max(200);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .optional();

export const workInput = z.object({
  title,
  subtitle: optionalText(200),
  author: z.string().trim().min(1, "Le nom d'auteur est requis").max(120),
  synopsis: optionalText(2000),
});
export const workUpdate = workInput.partial();

export const chapterCreate = z.object({ title: title.optional() });
export const chapterUpdate = z.object({
  title: title.optional(),
  content: z.string().max(500_000).optional(),
  wordGoal: z.number().int().min(0).max(1_000_000).nullable().optional(),
  baseFingerprint: z.string().max(64).optional(),
});
export const chapterOrder = z.object({ chapterIds: z.array(z.string().min(1)).min(1) });

export const versionCreate = z.object({
  label: z.string().trim().min(1).max(120),
  content: z.string().max(500_000).optional(),
});

export const commentCreate = z
  .object({
    reviewerName: z.string().trim().min(1, "Votre nom est requis").max(80),
    body: z.string().trim().min(1, "Le commentaire est vide").max(5000),
    quote: z.string().max(2000),
    startOffset: z.number().int().min(0),
    endOffset: z.number().int().min(0),
  })
  .refine((c) => c.endOffset >= c.startOffset, { message: "Sélection invalide" });

export const commentUpdate = z.object({ resolved: z.boolean() });

export const thesaurusQuery = z.object({ q: z.string().trim().min(1).max(60) });

export type WorkInput = z.infer<typeof workInput>;
export type ChapterUpdate = z.infer<typeof chapterUpdate>;
export type CommentCreate = z.infer<typeof commentCreate>;
