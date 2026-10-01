import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function RequireAuth() {
  const { data, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!data) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
