import { exports } from "cloudflare:workers";

const ORIGIN = "http://localhost:5173";

export type Session = { cookie: string };

export function call(path: string, init: RequestInit & { session?: Session; json?: unknown } = {}) {
  const { session, json, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Origin", ORIGIN);
  if (session) headers.set("Cookie", session.cookie);
  if (json !== undefined) headers.set("Content-Type", "application/json");
  return exports.default.fetch(
    new Request(`${ORIGIN}${path}`, {
      ...rest,
      headers,
      body: json === undefined ? rest.body : JSON.stringify(json),
    }),
  );
}

export async function signUp(email: string): Promise<Session> {
  const response = await call("/api/auth/sign-up/email", {
    method: "POST",
    json: { email, password: "motdepasse-test", name: "Autrice" },
  });
  if (!response.ok) throw new Error(`Inscription impossible : ${response.status}`);
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return { cookie };
}

export async function body<T>(response: Response): Promise<T> {
  return response.json<T>();
}
