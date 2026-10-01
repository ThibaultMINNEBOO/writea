import { createBrowserRouter } from "react-router";
import { AppHeader } from "@/components/app-header";

export const router = createBrowserRouter([
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
]);
