import { createBrowserRouter } from "react-router";
import { AuthPage } from "@/features/auth/auth-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { LibraryPage } from "@/features/library/library-page";

export const router = createBrowserRouter([
  { path: "/connexion", element: <AuthPage mode="signin" /> },
  { path: "/inscription", element: <AuthPage mode="signup" /> },
  {
    element: <RequireAuth />,
    children: [{ path: "/", element: <LibraryPage /> }],
  },
]);
