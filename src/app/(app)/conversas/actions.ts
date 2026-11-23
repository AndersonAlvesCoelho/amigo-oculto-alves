"use server";

import { avisarMensagemNova } from "@/lib/avisos";
import { minhasConversas } from "@/lib/conversas";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";

/** Chamado depois de enviar uma mensagem: agenda o aviso por e-mail. */
export async function avisarMensagemEnviada(sorteioId: string) {
  const eu = (await getSessao())?.participante;
  if (!eu) return;
  // Só vale para conversas da própria pessoa (e pega o papel dela nesta conversa)
  const { conversas } = await minhasConversas(await createClient(), eu.id);
  const conversa = conversas.find((c) => c.sorteioId === sorteioId);
  if (!conversa) return;
  after(() => avisarMensagemNova(sorteioId, conversa.papel));
}
