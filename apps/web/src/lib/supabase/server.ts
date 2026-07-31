import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@buffethub/database";

import { env } from "@/env";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 *
 * No Next.js 15, cookies() é assíncrono.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /*
             * Em Server Components os cookies são somente leitura.
             * O middleware será responsável por renovar a sessão.
             */
          }
        },
      },
    },
  );
}