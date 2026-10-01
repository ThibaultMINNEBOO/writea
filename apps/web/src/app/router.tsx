import { createBrowserRouter } from "react-router";
import { AuthPage } from "@/features/auth/auth-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { LibraryPage } from "@/features/library/library-page";
import { ReviewPage } from "@/features/review/review-page";
import { WorkspacePage } from "@/features/workspace/workspace-page";

export const router = createBrowserRouter([
  { path: "/connexion", element: <AuthPage mode="signin" /> },
  { path: "/inscription", element: <AuthPage mode="signup" /> },
  { path: "/relecture/:token", element: <ReviewPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: <LibraryPage /> },
      { path: "/oeuvres/:workId", element: <WorkspacePage /> },
      { path: "/oeuvres/:workId/chapitres/:chapterId", element: <WorkspacePage /> },
    ],
  },
]);
