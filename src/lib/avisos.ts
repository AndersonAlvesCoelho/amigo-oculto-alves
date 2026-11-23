import { enviarEmail, enviouTipoHaPouco } from "@/lib/email/enviar";
import { emailListaAlterada, emailMensagemNova } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import "server-only";

const TRES_HORAS = 3 * 60 * 60;
const UMA_HORA = 60 * 60;

type Destino = { id: string; nome: string; email: string; auth_user_id: string | null };

async function participante(id: string): Promise<Destino | null> {
  const { data } = await createAdminClient()
    .from("participantes")
    .select("id, nome, email, auth_user_id")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/**
 * Avisa quem tirou esta pessoa que a lista mudou.
 * No máximo um aviso a cada 3 horas, e só para quem já foi convidado.
 */
export async function avisarListaAlterada(donoDaListaId: string) {
  try {
    const { data: linha } = await createAdminClient()
      .from("sorteio")
      .select("quem_da_id")
      .eq("quem_recebe_id", donoDaListaId)
      .maybeSingle();
    if (!linha) return;

    const destino = await participante(linha.quem_da_id);
    if (!destino?.auth_user_id) return;
    if (await enviouTipoHaPouco(destino.email, "lista_alterada", TRES_HORAS)) return;

    await enviarEmail({
      para: destino.email,
      ...emailListaAlterada({ nome: destino.nome }),
      tipo: "lista_alterada",
      participanteId: destino.id,
    });
  } catch (erro) {
    console.error("Falha no aviso de lista alterada:", erro);
  }
}

/**
 * Avisa o outro lado da conversa que chegou mensagem.
 * No máximo um aviso por hora para cada pessoa.
 */
export async function avisarMensagemNova(sorteioId: string, papelDeQuemEnviou: "da" | "recebe") {
  try {
    const { data: linha } = await createAdminClient()
      .from("sorteio")
      .select("quem_da_id, quem_recebe_id")
      .eq("id", sorteioId)
      .maybeSingle();
    if (!linha) return;

    // Quem enviou como "da" escreveu para quem recebe, e vice-versa
    const destinoId = papelDeQuemEnviou === "da" ? linha.quem_recebe_id : linha.quem_da_id;
    const papelDoDestino = papelDeQuemEnviou === "da" ? "recebe" : "da";
    const destino = await participante(destinoId);
    if (!destino?.auth_user_id) return;
    if (await enviouTipoHaPouco(destino.email, "mensagem_nova", UMA_HORA)) return;

    await enviarEmail({
      para: destino.email,
      ...emailMensagemNova({ nome: destino.nome, papel: papelDoDestino }),
      tipo: "mensagem_nova",
      participanteId: destino.id,
    });
  } catch (erro) {
    console.error("Falha no aviso de mensagem nova:", erro);
  }
}
