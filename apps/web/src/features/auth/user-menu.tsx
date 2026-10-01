import { LogOutIcon, UserIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const navigate = useNavigate();
  const { data } = authClient.useSession();
  if (!data) return null;

  async function signOut() {
    await authClient.signOut();
    navigate("/connexion", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mon compte">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{data.user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {data.user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={signOut}>
            <LogOutIcon />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
