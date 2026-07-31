import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .min(1, "NEXT_PUBLIC_SUPABASE_URL é obrigatória")
      .url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida"),

    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
      .string()
      .min(
        1,
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY é obrigatória",
      ),

    NEXT_PUBLIC_APP_URL: z
      .string()
      .url("NEXT_PUBLIC_APP_URL deve ser uma URL válida")
      .default("http://localhost:3000"),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL,

    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,

    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL,
  },

  emptyStringAsUndefined: true,

  skipValidation:
    process.env.SKIP_ENV_VALIDATION === "true",

  onValidationError: (issues) => {
    console.error(
      "❌ Variáveis de ambiente inválidas:",
      JSON.stringify(issues, null, 2),
    );

    throw new Error("Invalid environment variables");
  },
});