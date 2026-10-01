import type { AppType } from "@writea/api";
import { hc, type InferResponseType } from "hono/client";
import { trackedFetch } from "./connectivity";

export const api = hc<AppType>(window.location.origin, {
  fetch: trackedFetch,
  init: { credentials: "include" },
}).api;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function unwrap<T>(
  request: Promise<{ ok: boolean; status: number; json(): Promise<T> }>,
) {
  const response = await request;
  if (response.ok) return response.status === 204 ? (undefined as T) : response.json();
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : "Une erreur est survenue";
  throw new ApiError(message, response.status);
}

export type WorkSummary = InferResponseType<typeof api.works.$get, 200>[number];
export type WorkDetail = InferResponseType<(typeof api.works)[":id"]["$get"], 200>;
export type ChapterSummary = WorkDetail["chapters"][number];
export type Chapter = InferResponseType<(typeof api.chapters)[":id"]["$get"], 200>;

export const epubUrl = (id: string) =>
  api.works[":id"]["export.epub"].$url({ param: { id } }).pathname;
