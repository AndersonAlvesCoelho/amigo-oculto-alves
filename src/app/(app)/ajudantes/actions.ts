"use server";

import { enviarConvite, situacaoConta } from "@/lib/acesso";
import { enviouHaPouco } from "@/lib/email/enviar";
import { getSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type Resultado = { ok: boolean; mensagem: string };

const emailSchema = z.string().trim().toLowerCase().email("Digite um e-mail válido.");

/** Convida um e-mail de fora para ajudar e envia o link por e-mail. */
export async function convidarAjudante(email: string): Promise<Resultado> {
  const eu = (await getSessao())?.participante;
  if (!eu) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, mensagem: parsed.error.issues[0].message };
  const alvo = parsed.data;

  // Participantes não podem ser ajudantes (veriam o segredo de outra pessoa)
  const admin = createAdminClient();
  const { data: participante } = await admin
    .from("participantes")
    .select("id")
    .eq("email", alvo)
    .maybeSingle();
  if (participante) {
    return { ok: false, mensagem: "Esse e-mail é de um participante. Convide alguém de fora do sorteio." };
  }

  const supabase = await createClient();
  const { data: novo, error } = await supabase
    .from("ajudantes")
    .insert({ participante_id: eu.id, email: alvo })
    .select("id, auth_user_id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, mensagem: "Esse ajudante já está na sua lista." };
    console.error("Falha ao convidar ajudante:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível convidar agora. Tente de novo." };
  }

  const ok = await enviarConvite({
    participanteId: null,
    email: alvo,
    convidadoPor: eu.nome,
    authUserId: novo.auth_user_id,
    isAdmin: false,
  });
  revalidatePath("/ajudantes");
  return ok
    ? { ok: true, mensagem: `Convite enviado para ${alvo}.` }
    : { ok: false, mensagem: "O ajudante foi adicionado, mas o e-mail falhou. Use “Reenviar”." };
}

/** Reenvia o convite para um ajudante que ainda não ativou. */
export async function reenviarConviteAjudante(id: string): Promise<Resultado> {
  const eu = (await getSessao())?.participante;
  if (!eu) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };

  const supabase = await createClient();
  const { data: ajudante } = await supabase
    .from("ajudantes")
    .select("email, auth_user_id")
    .eq("id", id)
    .eq("participante_id", eu.id)
    .maybeSingle();
  if (!ajudante) return { ok: false, mensagem: "Ajudante não encontrado." };

  if ((await situacaoConta(ajudante.auth_user_id)) === "ativa") {
    return { ok: false, mensagem: "Esse ajudante já ativou o acesso." };
  }
  if (await enviouHaPouco(ajudante.email)) {
    return { ok: false, mensagem: "Acabamos de enviar. Espere um minuto." };
  }
  const ok = await enviarConvite({
    participanteId: null,
    email: ajudante.email,
    convidadoPor: eu.nome,
    authUserId: ajudante.auth_user_id,
    isAdmin: false,
  });
  return ok
    ? { ok: true, mensagem: "Convite reenviado." }
    : { ok: false, mensagem: "O e-mail falhou. Tente de novo." };
}

export async function removerAjudante(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("ajudantes").delete().eq("id", id);
  if (error) {
    console.error("Falha ao remover ajudante:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível remover. Tente de novo." };
  }
  revalidatePath("/ajudantes");
  return { ok: true, mensagem: "Ajudante removido." };
}
