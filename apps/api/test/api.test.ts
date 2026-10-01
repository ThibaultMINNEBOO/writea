import { describe, expect, it } from "vitest";
import { body, call, type Session, signUp } from "./client";

type Work = { id: string; chapters: { id: string; title: string }[] };
type Chapter = { id: string; content: string; wordCount: number };

async function createWork(session: Session) {
  const created = await call("/api/works", {
    method: "POST",
    session,
    json: { title: "Le Grand Large", author: "Jeanne" },
  });
  expect(created.status).toBe(201);
  const { id } = await body<{ id: string }>(created);
  return body<Work>(await call(`/api/works/${id}`, { session }));
}

describe("API Writea", () => {
  it("refuse l'accès sans session", async () => {
    const response = await call("/api/works");
    expect(response.status).toBe(401);
    expect(await body<{ error: string }>(response)).toEqual({ error: "Authentification requise" });
  });

  it("crée une œuvre avec un premier chapitre et compte les mots à l'enregistrement", async () => {
    const session = await signUp("autrice-1@exemple.fr");
    const work = await createWork(session);
    expect(work.chapters.map((chapter) => chapter.title)).toEqual(["Chapitre 1"]);

    const chapterId = work.chapters[0]?.id ?? "";
    const saved = await call(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      session,
      json: { content: "— Bonjour, dit-elle à l'enfant." },
    });
    expect((await body<Chapter>(saved)).wordCount).toBe(4);
  });

  it("isole les œuvres de chaque utilisateur", async () => {
    const owner = await signUp("autrice-2@exemple.fr");
    const intruder = await signUp("intrus@exemple.fr");
    const work = await createWork(owner);
    const chapterId = work.chapters[0]?.id ?? "";

    expect((await call(`/api/works/${work.id}`, { session: intruder })).status).toBe(404);
    expect(
      (
        await call(`/api/chapters/${chapterId}`, {
          method: "PATCH",
          session: intruder,
          json: { content: "piraté" },
        })
      ).status,
    ).toBe(404);
  });

  it("partage une version figée, recueille un commentaire puis révoque le lien", async () => {
    const session = await signUp("autrice-3@exemple.fr");
    const work = await createWork(session);
    const chapterId = work.chapters[0]?.id ?? "";
    await call(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      session,
      json: { content: "Il partit — sans un mot." },
    });

    const version = await body<{ id: string }>(
      await call(`/api/chapters/${chapterId}/versions`, {
        method: "POST",
        session,
        json: { label: "Premier jet" },
      }),
    );
    const { token } = await body<{ token: string }>(
      await call(`/api/versions/${version.id}/share`, { method: "POST", session }),
    );

    const shared = await call(`/api/review/${token}`);
    expect(await body<{ content: string }>(shared)).toMatchObject({
      content: "Il partit — sans un mot.",
    });

    const comment = await call(`/api/review/${token}/comments`, {
      method: "POST",
      json: {
        reviewerName: "Camille",
        body: "Belle incise.",
        quote: "sans un mot",
        startOffset: 12,
        endOffset: 23,
      },
    });
    expect(comment.status).toBe(201);

    const comments = await body<{ reviewerName: string }[]>(
      await call(`/api/chapters/${chapterId}/comments`, { session }),
    );
    expect(comments.map((c) => c.reviewerName)).toEqual(["Camille"]);

    await call(`/api/versions/${version.id}/share`, { method: "DELETE", session });
    expect((await call(`/api/review/${token}`)).status).toBe(404);
  });

  it("exporte l'œuvre au format EPUB", async () => {
    const session = await signUp("autrice-4@exemple.fr");
    const work = await createWork(session);
    const response = await call(`/api/works/${work.id}/export.epub`, { session });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/epub+zip");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes.subarray(30, 38))).toBe("mimetype");
  });
});
