"use server";

import { avisarListaAlterada } from "@/lib/avisos";
import { buscarFotoDoLink } from "@/lib/previa-link";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

export type Resultado = { ok: true } | { ok: false; mensagem: string };

const vazioParaNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const schema = z.object({
  id: z.preprocess(vazioParaNull, z.uuid().nullable()),
  nome: z.string().trim().min(1, "Dê um nome ao presente.").max(120, "Nome muito longo."),
  preco: z.preprocess(
    (v) => {
      const s = vazioParaNull(v);
      return s === null ? null : Number(String(s).replace(",", "."));
    },
    z.number("Preço inválido.").min(0, "O preço não pode ser negativo.").max(100000).nullable(),
  ),
  link: z.preprocess(vazioParaNull, z.url("Link inválido.").max(2000).nullable()),
  descricao: z.preprocess(
    vazioParaNull,
    z.string().trim().max(500, "Descrição muito longa (máx. 500).").nullable(),
  ),
  imagem_url: z.preprocess(vazioParaNull, z.url().max(2000).nullable()),
});

/**
 * De quem é a lista que está sendo editada: a do próprio participante, ou,
 * para um ajudante, a do participante que ele ajuda (informado no formulário).
 * O banco confere de novo pelas regras de segurança (RLS).
 */
async function donoDaLista(pedido: unknown): Promise<string | null> {
  const sessao = await getSessao();
  if (!sessao) return null;
  if (sessao.participante) return sessao.participante.id;
  if (!sessao.ajudando || typeof pedido !== "string" || !z.uuid().safeParse(pedido).success) {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("ajudantes")
    .select("participante_id")
    .eq("auth_user_id", sessao.userId)
    .eq("participante_id", pedido)
    .maybeSingle();
  return data?.participante_id ?? null;
}

function atualizarTelas() {
  revalidatePath("/minha-lista");
  revalidatePath("/ajudando");
}

export async function salvarPresente(formData: FormData): Promise<Resultado> {
  const dono = await donoDaLista(formData.get("participante_id"));
  if (!dono) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };
  formData.delete("participante_id");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, mensagem: parsed.error.issues[0].message };
  const { id, ...campos } = parsed.data;

  // Sem prévia vinda da tela? Tenta buscar a foto pelo link agora.
  let imagem_url = campos.imagem_url;
  if (!imagem_url && campos.link) imagem_url = await buscarFotoDoLink(campos.link);
  if (!campos.link) imagem_url = null;

  const supabase = await createClient();
  const dados = { ...campos, imagem_url };
  const { error } = id
    ? await supabase.from("itens_desejo").update(dados).eq("id", id)
    : await supabase.from("itens_desejo").insert({ ...dados, participante_id: dono });

  if (error) {
    console.error("Falha ao salvar presente:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
  }
  atualizarTelas();
  after(() => avisarListaAlterada(dono)); // envia depois de responder à tela
  return { ok: true };
}

export async function excluirPresente(id: string): Promise<Resultado> {
  if (!(await getSessao())) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("itens_desejo")
    .select("participante_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("itens_desejo").delete().eq("id", id);
  if (error) {
    console.error("Falha ao excluir presente:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível excluir. Tente de novo." };
  }
  atualizarTelas();
  if (item) after(() => avisarListaAlterada(item.participante_id));
  return { ok: true };
}

/** Usado pelo formulário para mostrar a foto assim que o link é colado. */
export async function previaDoLink(link: string): Promise<string | null> {
  const sessao = await getSessao();
  if (!sessao?.participante && !sessao?.ajudando) return null;
  return buscarFotoDoLink(link);
}
