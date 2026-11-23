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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("participantes")
    .select("id, nome, email, is_admin, auth_user_id")
    .is("auth_user_id", null)
    .order("nome");
  if (error) {
    console.error("Falha ao listar participantes:", error.message);
    return { ok: false, mensagem: "Não foi possível listar os participantes." };
  }
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
