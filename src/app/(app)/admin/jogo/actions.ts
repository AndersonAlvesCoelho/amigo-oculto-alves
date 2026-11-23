"use server";

import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: boolean; mensagem: string };

const FUNCOES = {
  proxima: "jogo_proxima_rodada",
  revelar: "jogo_revelar",
} as const;

/** Executa um comando do jogo. As funções do banco conferem se é admin. */
export async function comandoJogo(acao: keyof typeof FUNCOES): Promise<Resultado> {
  if (!(await getSessao())?.participante?.is_admin) {
    return { ok: false, mensagem: "Apenas admins." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc(FUNCOES[acao]);
  if (error) {
    console.error(`Falha em ${FUNCOES[acao]}:`, error.code, error.message);
    return { ok: false, mensagem: error.message };
  }
  const ok = { proxima: "Rodada aberta! O relógio de 3 minutos começou.", revelar: "Revelado!" };
  return { ok: true, mensagem: ok[acao] };
}
