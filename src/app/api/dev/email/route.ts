import {
  emailAcesso,
  emailAjudante,
  emailConvite,
  emailLembrete,
  emailListaAlterada,
  emailMensagemNova,
} from "@/lib/email/templates";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Prévia dos e-mails no navegador, só em desenvolvimento:
 * /api/dev/email?tipo=convite|acesso|ajudante|lista|mensagem|lembrete7|lembrete2
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ erro: "indisponível" }, { status: 404 });
  }
  const link = "#";
  const nome = "Leonor";
  const modelos = {
    convite: emailConvite({ nome, link }),
    acesso: emailAcesso({ nome, link }),
    ajudante: emailAjudante({ quemConvidou: "Anderson", link }),
    lista: emailListaAlterada({ nome }),
    mensagem: emailMensagemNova({ nome, papel: "recebe" }),
    lembrete7: emailLembrete({ nome, dias: 7, dataTexto: "2 de janeiro às 18:00" }),
    lembrete2: emailLembrete({ nome, dias: 2, dataTexto: "2 de janeiro às 18:00" }),
  };
  const tipo = (request.nextUrl.searchParams.get("tipo") ?? "convite") as keyof typeof modelos;
  const email = modelos[tipo] ?? modelos.convite;
  const menu = Object.keys(modelos)
    .map((t) => `<a href="?tipo=${t}" style="margin-right:12px">${t}</a>`)
    .join("");
  const html = email.html.replace(
    "<body",
    `<div style="font:13px sans-serif;padding:10px;background:#fff;border-bottom:1px solid #ddd">Assunto: <b>${email.assunto}</b><br>${menu}</div><body`,
  );
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
