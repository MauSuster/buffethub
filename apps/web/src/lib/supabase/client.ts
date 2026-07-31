import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@buffethub/database";

import { env } from "@/env";

/**
 * Cliente Supabase para uso em componentes do browser ("use client").
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}