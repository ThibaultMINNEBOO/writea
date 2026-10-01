const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const encoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_LENGTH_BITS,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }) {
  const [scheme, iterations, salt, expected] = hash.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !expected) return false;
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  return constantTimeEqual(actual, fromBase64(expected));
}
