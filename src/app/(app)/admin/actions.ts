"use server";

import { enviarConvite } from "@/lib/acesso";
import { getSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type ResultadoConvite = { ok: boolean; mensagem: string } | null;

type LinhaBanco = {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
  auth_user_id: string | null;
};

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function souAdmin() {
  const sessao = await getSessao();
  return Boolean(sessao?.participante?.is_admin);
}

async function sorteioFeito() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("sorteio")
    .select("id", { count: "exact", head: true });
  if (error) console.error("Falha ao consultar sorteio:", error.message);
  return (count ?? 0) > 0;
}

function paraPessoa(p: LinhaBanco) {
  return {
    participanteId: p.id,
    nome: p.nome,
    email: p.email,
    authUserId: p.auth_user_id,
    isAdmin: p.is_admin,
  };
}

/** Envia o convite do sorteio para todos que ainda não foram convidados. */
export async function enviarConvitesPendentes(): Promise<ResultadoConvite> {
  if (!(await souAdmin())) return { ok: false, mensagem: "Apenas admins." };
  if (!(await sorteioFeito())) {
    return { ok: false, mensagem: "Rode o sorteio antes de enviar os convites." };
  }

  // Pendentes = quem ainda não recebeu o e-mail do sorteio (admins incluídos)
  const admin = createAdminClient();
  const [lista, logConvites] = await Promise.all([
    admin.from("participantes").select("id, nome, email, is_admin, auth_user_id").order("nome"),
    admin.from("log_emails").select("email_destino").eq("tipo", "convite").eq("status", "enviado"),
  ]);
  if (lista.error || logConvites.error) {
    console.error("Falha ao listar participantes:", lista.error?.message ?? logConvites.error?.message);
    return { ok: false, mensagem: "Não foi possível listar os participantes." };
  }
  const jaRecebeu = new Set(logConvites.data.map((e) => e.email_destino));
  const data = lista.data.filter((p) => !jaRecebeu.has(p.email));
  if (data.length === 0) {
    return { ok: true, mensagem: "Todos já foram convidados." };
  }

  const falhas: string[] = [];
  for (const p of data) {
    const ok = await enviarConvite(paraPessoa(p));
    if (!ok) falhas.push(p.nome);
    await espera(600); // respeita o limite de envios por segundo do Resend
  }

  revalidatePath("/admin");
  const enviados = data.length - falhas.length;
  return falhas.length === 0
    ? { ok: true, mensagem: `${enviados} convite(s) enviado(s).` }
    : {
        ok: false,
        mensagem: `${enviados} enviado(s). Falharam: ${falhas.join(", ")}.`,
      };
}

/** Envia (ou reenvia) o convite para uma pessoa. */
export async function enviarConviteParticipante(
  _estado: ResultadoConvite,
  formData: FormData,
): Promise<ResultadoConvite> {
  if (!(await souAdmin())) return { ok: false, mensagem: "Apenas admins." };
  if (!(await sorteioFeito())) {
    return { ok: false, mensagem: "Rode o sorteio antes." };
  }

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("participantes")
    .select("id, nome, email, is_admin, auth_user_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return { ok: false, mensagem: "Participante não encontrado." };
  }

  const ok = await enviarConvite(paraPessoa(data));
  revalidatePath("/admin");
  return ok
    ? { ok: true, mensagem: "Enviado." }
    : { ok: false, mensagem: "Falhou. Veja o terminal." };
}

/** Admin cadastra um ajudante para um participante e envia o convite de ajudante. */
export async function adicionarAjudanteAdmin(
  _estado: ResultadoConvite,
  formData: FormData,
): Promise<ResultadoConvite> {
  if (!(await souAdmin())) return { ok: false, mensagem: "Apenas admins." };

  const participanteId = String(formData.get("participante_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, mensagem: "Digite um e-mail válido." };
  }

  const admin = createAdminClient();
  const [{ data: participante }, { data: ehParticipante }] = await Promise.all([
    admin.from("participantes").select("id, nome").eq("id", participanteId).maybeSingle(),
    admin.from("participantes").select("id").eq("email", email).maybeSingle(),
  ]);
  if (!participante) return { ok: false, mensagem: "Participante não encontrado." };
  if (ehParticipante) {
    return { ok: false, mensagem: "Esse e-mail é de um participante. Use o de alguém de fora." };
  }

  // o banco liga sozinho à conta, se esse e-mail já tiver uma
  const { data: novo, error } = await admin
    .from("ajudantes")
    .insert({ participante_id: participante.id, email })
    .select("auth_user_id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, mensagem: "Esse ajudante já está cadastrado." };
    console.error("Falha ao adicionar ajudante:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível adicionar. Tente de novo." };
  }

  const ok = await enviarConvite({
    participanteId: null,
    email,
    convidadoPor: participante.nome,
    authUserId: novo.auth_user_id,
    isAdmin: false,
  });
  revalidatePath("/admin");
  return ok
    ? { ok: true, mensagem: `Ajudante adicionado e convite enviado para ${email}.` }
    : { ok: false, mensagem: "Ajudante adicionado, mas o e-mail falhou. Peça para entrar pelo /entrar." };
}
