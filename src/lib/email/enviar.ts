import { createAdminClient } from "@/lib/supabase/admin";
import "server-only";

/** Tipos aceitos pela coluna log_emails.tipo (ver migration 003). */
export type TipoEmail =
  | "convite"
  | "acesso"
  | "ajudante"
  | "lista_alterada"
  | "mensagem_nova"
  | "lembrete";

const REMETENTE = '"Amigo Oculto Alves" <convite@amigoocultoalves.com.br>';

type Envio = {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  tipo: TipoEmail;
  participanteId?: string | null;
};

/** Envia um e-mail pelo Resend e registra o resultado em log_emails. */
export async function enviarEmail(envio: Envio): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  let ok = false;

  if (!chave) {
    console.error("RESEND_API_KEY não está configurada no .env");
  } else {
    try {
      const resposta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chave}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: REMETENTE,
          to: [envio.para],
          subject: envio.assunto,
          html: envio.html,
          text: envio.texto,
          ...(process.env.EMAIL_RESPONDER_PARA
            ? { reply_to: process.env.EMAIL_RESPONDER_PARA }
            : {}),
        }),
      });
      ok = resposta.ok;
      if (!ok) {
        console.error(
          "Resend recusou o envio:",
          resposta.status,
          await resposta.text(),
        );
      }
    } catch (erro) {
      console.error("Falha ao falar com o Resend:", erro);
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("log_emails").insert({
    participante_id: envio.participanteId ?? null,
    email_destino: envio.para,
    tipo: envio.tipo,
    status: ok ? "enviado" : "falhou",
  });
  if (error) console.error("Falha ao registrar o e-mail:", error.message);

  return ok;
}

/** true se já saiu um convite ou link de acesso para este e-mail há pouco. */
export async function enviouHaPouco(email: string, segundos = 60) {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - segundos * 1000).toISOString();
  const { count, error } = await admin
    .from("log_emails")
    .select("id", { count: "exact", head: true })
    .eq("email_destino", email)
    .in("tipo", ["convite", "acesso", "ajudante"])
    .eq("status", "enviado")
    .gte("enviado_em", desde);

  if (error) {
    console.error("Falha ao consultar log_emails:", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

/** true se já saiu um e-mail deste tipo para o endereço dentro da janela. */
export async function enviouTipoHaPouco(email: string, tipo: TipoEmail, segundos: number) {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - segundos * 1000).toISOString();
  const { count, error } = await admin
    .from("log_emails")
    .select("id", { count: "exact", head: true })
    .eq("email_destino", email)
    .eq("tipo", tipo)
    .eq("status", "enviado")
    .gte("enviado_em", desde);
  if (error) {
    console.error("Falha ao consultar log_emails:", error.message);
    return true; // na dúvida, não envia (evita e-mail repetido)
  }
  return (count ?? 0) > 0;
}
