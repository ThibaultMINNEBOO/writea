import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { authClient, translateAuthError } from "@/lib/auth-client";

type Mode = "signin" | "signup";

const copy = {
  signin: {
    title: "Bon retour parmi nous",
    description: "Reprenez votre manuscrit là où vous l'aviez laissé.",
    submit: "Se connecter",
    switchLabel: "Pas encore de compte ?",
    switchLink: { to: "/inscription", label: "Créer un compte" },
  },
  signup: {
    title: "Ouvrez votre atelier",
    description: "Un espace calme pour écrire, faire relire et publier votre œuvre.",
    submit: "Créer mon compte",
    switchLabel: "Déjà inscrit ?",
    switchLink: { to: "/connexion", label: "Se connecter" },
  },
} as const;

const readField = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const text = copy[mode];
  const redirectTo =
    location.state && typeof location.state === "object" && "from" in location.state
      ? String(location.state.from)
      : "/";

  if (session) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = readField(form, "email");
    const password = readField(form, "password");
    setPending(true);
    setError(null);

    const { error: authError } =
      mode === "signin"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: readField(form, "name") });

    setPending(false);
    if (authError) {
      setError(translateAuthError(authError.code));
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="relative grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="text-center font-serif text-3xl font-semibold tracking-tight">
          Writea
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{text.title}</CardTitle>
            <CardDescription>{text.description}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                {mode === "signup" && (
                  <Field>
                    <FieldLabel htmlFor="name">Nom ou nom de plume</FieldLabel>
                    <Input id="name" name="name" autoComplete="name" required />
                  </Field>
                )}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </Field>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    aria-invalid={Boolean(error)}
                    required
                  />
                  {error && <FieldError>{error}</FieldError>}
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="mt-6 flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                {text.submit}
              </Button>
              <p className="text-sm text-muted-foreground">
                {text.switchLabel}{" "}
                <Link
                  to={text.switchLink.to}
                  className="text-foreground underline underline-offset-4"
                >
                  {text.switchLink.label}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
