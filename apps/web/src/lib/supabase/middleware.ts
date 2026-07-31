import { createServerClient } from "@supabase/ssr";
import type { Database } from "@buffethub/database";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";

/**
 * Renova a sessão em cada request e protege rotas.
 *
 * Deve ser chamado pelo middleware principal da aplicação.
 * Sempre retorna a response para preservar os cookies atualizados pelo Supabase.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          /*
           * Atualiza os cookies na request atual para que o restante
           * do middleware enxergue a sessão renovada.
           */
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          /*
           * Recria a response utilizando a request com os cookies atualizados.
           */
          response = NextResponse.next({
            request,
          });

          /*
           * Envia os cookies atualizados ao navegador.
           */
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  /*
   * getUser() revalida o token diretamente no servidor do Supabase.
   * Não substitua por getSession() para decisões de autorização.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/entrar" ||
    pathname === "/cadastrar";

  const isProtectedRoute =
    pathname === "/painel" ||
    pathname.startsWith("/painel/");

  /*
   * Usuários não autenticados não podem acessar o painel.
   */
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = "/entrar";
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    const redirectResponse = NextResponse.redirect(redirectUrl);

    /*
     * Preserva cookies que possam ter sido renovados antes do redirecionamento.
     */
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  /*
   * Usuários autenticados não precisam acessar páginas de login e cadastro.
   */
  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = "/painel";
    redirectUrl.search = "";

    const redirectResponse = NextResponse.redirect(redirectUrl);

    /*
     * Preserva cookies atualizados pelo Supabase no redirecionamento.
     */
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return response;
}