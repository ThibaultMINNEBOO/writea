const PREFIX = "writea:draft:";

export type Draft = {
  chapterId: string;
  workId: string;
  content: string;
  baseFingerprint: string;
  savedAt: number;
};

const claimed = new Set<string>();

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  return (
    "chapterId" in value &&
    typeof value.chapterId === "string" &&
    "workId" in value &&
    typeof value.workId === "string" &&
    "content" in value &&
    typeof value.content === "string" &&
    "baseFingerprint" in value &&
    typeof value.baseFingerprint === "string"
  );
}

function parse(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isDraft(value) ? value : null;
  } catch {
    return null;
  }
}

export function readDraft(chapterId: string): Draft | null {
  try {
    return parse(localStorage.getItem(PREFIX + chapterId));
  } catch {
    return null;
  }
}

export function writeDraft(draft: Draft) {
  try {
    localStorage.setItem(PREFIX + draft.chapterId, JSON.stringify(draft));
  } catch {}
}

/** Called once `content` reached the server: drops the draft, or rebases newer local edits. */
export function settleDraft(chapterId: string, content: string, fingerprint: string) {
  const draft = readDraft(chapterId);
  if (!draft) return;
  try {
    if (draft.content === content) localStorage.removeItem(PREFIX + chapterId);
    else writeDraft({ ...draft, baseFingerprint: fingerprint });
  } catch {}
}

export function listDrafts(): Draft[] {
  const drafts: Draft[] = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(PREFIX)) continue;
      const draft = parse(localStorage.getItem(key));
      if (draft) drafts.push(draft);
    }
  } catch {}
  return drafts;
}

/** Marks a chapter as handled by an open editor so background sync leaves it alone. */
export function claimDraft(chapterId: string) {
  claimed.add(chapterId);
  return () => {
    claimed.delete(chapterId);
  };
}

export const isDraftClaimed = (chapterId: string) => claimed.has(chapterId);
