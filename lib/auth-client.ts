/**
 * Client-side Better Auth client.
 * Used by auth pages and components to interact with the auth server.
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000",
});

// Re-export commonly used helpers
export const { signIn, signUp, signOut, useSession } = authClient;
