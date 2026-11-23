"use server";

import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type Resultado = { ok: boolean; mensagem: string };

/**
 * Executa um comando do jogo. As funções do banco conferem se é admin.
 * Para começar um círculo, informe quem começa (`iniciar`).
 */
export async function comandoJogo(acao: "proxima" | "revelar", iniciar?: string): Promise<Resultado> {
  if (!(await getSessao())?.participante?.is_admin) {
    return { ok: false, mensagem: "Apenas admins." };
  }
  const supabase = await createClient();
  const { error } =
    acao === "revelar"
      ? await supabase.rpc("jogo_revelar")
      : await supabase.rpc("jogo_proxima_rodada", {
          p_iniciar: iniciar && z.uuid().safeParse(iniciar).success ? iniciar : null,
        });
  if (error) {
    console.error(`Falha no comando ${acao}:`, error.code, error.message);
    return { ok: false, mensagem: error.message };
  }
  return {
    ok: true,
    mensagem: acao === "revelar" ? "Revelado!" : "Rodada aberta! O relógio de 3 minutos começou.",
  };
}
