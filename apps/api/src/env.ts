import type { SessionUser } from "./auth";
import type { Database } from "./db/client";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: Database;
    user: SessionUser | null;
  };
};

export type AuthedEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { user: SessionUser };
};
