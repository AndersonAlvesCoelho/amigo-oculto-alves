import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import "server-only";

export type Sessao = {
  userId: string;
  participante: { id: string; nome: string; is_admin: boolean } | null;
  ajudando: boolean;
};

/** Retorna quem está logado (uma vez por requisição). */
export const getSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  // userId vem de um token verificado; a busca usa o admin porque
  // auth_user_id não é exposto pelas regras de segurança.
  const admin = createAdminClient();
  const [{ data: participante }, { data: ajudante }] = await Promise.all([
    admin
      .from("participantes")
      .select("id, nome, is_admin")
      .eq("auth_user_id", userId)
      .maybeSingle(),
    admin
      .from("ajudantes")
      .select("id")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle(),
  ]);

  return { userId, participante, ajudando: Boolean(ajudante) };
});
