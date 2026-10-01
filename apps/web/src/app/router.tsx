import { createBrowserRouter } from "react-router";
import { RouteError } from "@/components/route-error";
import { RequireAuth } from "@/features/auth/require-auth";

const workspace = async () => ({
  Component: (await import("@/features/workspace/workspace-page")).WorkspacePage,
});

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        path: "/connexion",
        lazy: async () => {
          const { AuthPage } = await import("@/features/auth/auth-page");
          return { element: <AuthPage mode="signin" /> };
        },
      },
      {
        path: "/inscription",
        lazy: async () => {
          const { AuthPage } = await import("@/features/auth/auth-page");
          return { element: <AuthPage mode="signup" /> };
        },
      },
      {
        path: "/relecture/:token",
        lazy: async () => ({
          Component: (await import("@/features/review/review-page")).ReviewPage,
        }),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: "/",
            lazy: async () => ({
              Component: (await import("@/features/library/library-page")).LibraryPage,
            }),
          },
          { path: "/oeuvres/:workId", lazy: workspace },
          { path: "/oeuvres/:workId/chapitres/:chapterId", lazy: workspace },
        ],
      },
    ],
  },
]);
