import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({ basePath: "/api/auth" });

const authErrorMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet email.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cet email.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",
  INVALID_EMAIL: "Adresse email invalide.",
};

export const translateAuthError = (code: string | undefined) =>
  (code && authErrorMessages[code]) ?? "Une erreur est survenue, veuillez réessayer.";
