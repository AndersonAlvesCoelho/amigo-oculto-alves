import { enviarEmail, enviouTipoHaPouco } from "@/lib/email/enviar";
import { emailLembrete } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rotina diária (Vercel Cron, 8h de Brasília):
 *  1. consulta o banco, para o Supabase gratuito não pausar por inatividade;
 *  2. 7 e 2 dias antes da festa, envia o lembrete para quem já foi convidado;
 *  3. a partir de ADMIN_RESTAURAR_EM, devolve o admin para ADMIN_RESTAURAR_EMAIL.
 *
 * Protegida por CRON_SECRET (a Vercel envia "Authorization: Bearer <CRON_SECRET>").
 * Para testar à mão: /api/cron/diario?hoje=2026-12-26 com o mesmo cabeçalho.
 */
export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";
const DIAS_DE_LEMBRETE = [7, 2];

/** "AAAA-MM-DD" no fuso de Brasília. */
function diaEmBrasilia(data: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(data);
}
function diasEntre(de: string, ate: string) {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);
}

export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const relatorio: Record<string, unknown> = {};

  // 1. Mantém o banco acordado
  const { count, error } = await admin
    .from("participantes")
    .select("id", { count: "exact", head: true });
  relatorio.banco = error ? `erro: ${error.message}` : `ok (${count} participantes)`;

  const hojeParam = request.nextUrl.searchParams.get("hoje");
  const hoje = hojeParam && /^\d{4}-\d{2}-\d{2}$/.test(hojeParam) ? hojeParam : diaEmBrasilia(new Date());
  relatorio.hoje = hoje;

  // 2. Lembretes da festa
  const festaIso = process.env.NEXT_PUBLIC_DATA_FESTA;
  if (festaIso && !Number.isNaN(Date.parse(festaIso))) {
    const festa = new Date(festaIso);
    const faltam = diasEntre(hoje, diaEmBrasilia(festa));
    relatorio.faltam_dias = faltam;

    if (DIAS_DE_LEMBRETE.includes(faltam)) {
      const dataTexto = `${festa.toLocaleDateString("pt-BR", { timeZone: FUSO, day: "numeric", month: "long" })} às ${festa.toLocaleTimeString("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" })}`;
      const { data: pessoas } = await admin
        .from("participantes")
        .select("id, nome, email")
        .not("auth_user_id", "is", null);

      let enviados = 0;
      for (const p of pessoas ?? []) {
        // evita repetir se o cron rodar duas vezes no mesmo dia
        if (await enviouTipoHaPouco(p.email, "lembrete", 20 * 60 * 60)) continue;
        const ok = await enviarEmail({
          para: p.email,
          ...emailLembrete({ nome: p.nome, dias: faltam, dataTexto }),
          tipo: "lembrete",
          participanteId: p.id,
        });
        if (ok) enviados++;
        await new Promise((r) => setTimeout(r, 600)); // limite do Resend
      }
      relatorio.lembretes = enviados;
    }
  }

  // 3. Devolve o admin no dia combinado
  const emailAdmin = process.env.ADMIN_RESTAURAR_EMAIL?.trim().toLowerCase();
  const quando = process.env.ADMIN_RESTAURAR_EM;
  if (emailAdmin && quando && !Number.isNaN(Date.parse(quando))) {
    const agora = hojeParam ? Date.parse(`${hoje}T23:59:59-03:00`) : Date.now();
    if (agora >= Date.parse(quando)) {
      const { data, error: erroAdmin } = await admin
        .from("participantes")
        .update({ is_admin: true })
        .eq("email", emailAdmin)
        .eq("is_admin", false)
        .select("id");
      relatorio.admin = erroAdmin ? `erro: ${erroAdmin.message}` : data.length ? "devolvido" : "já era admin";
    } else {
      relatorio.admin = "ainda não é o dia";
    }
  }

  console.log("Cron diário:", relatorio);
  return NextResponse.json(relatorio);
}
