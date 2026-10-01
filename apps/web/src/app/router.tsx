import { createBrowserRouter } from "react-router";
import { AppHeader } from "@/components/app-header";
import { AuthPage } from "@/features/auth/auth-page";
import { RequireAuth } from "@/features/auth/require-auth";

export const router = createBrowserRouter([
  { path: "/connexion", element: <AuthPage mode="signin" /> },
  { path: "/inscription", element: <AuthPage mode="signup" /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: (
          <>
            <AppHeader />
            <main className="mx-auto max-w-6xl p-4">
              <h1 className="font-serif text-3xl">Votre atelier d'écriture</h1>
            </main>
          </>
        ),
      },
    ],
  },
]);
