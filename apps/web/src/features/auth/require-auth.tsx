import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "./use-current-user";

export function RequireAuth() {
  const { user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
