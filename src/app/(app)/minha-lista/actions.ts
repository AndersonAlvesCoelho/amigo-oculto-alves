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

export async function salvarPresente(formData: FormData): Promise<Resultado> {
  const sessao = await getSessao();
  const eu = sessao?.participante;
  if (!eu) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };

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
    : await supabase.from("itens_desejo").insert({ ...dados, participante_id: eu.id });

  if (error) {
    console.error("Falha ao salvar presente:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
  }
  revalidatePath("/minha-lista");
  after(() => avisarListaAlterada(eu.id)); // envia depois de responder à tela
  return { ok: true };
}

export async function excluirPresente(id: string): Promise<Resultado> {
  const eu = (await getSessao())?.participante;
  if (!eu) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };
  const supabase = await createClient();
  const { error } = await supabase.from("itens_desejo").delete().eq("id", id);
  if (error) {
    console.error("Falha ao excluir presente:", error.code, error.message);
    return { ok: false, mensagem: "Não foi possível excluir. Tente de novo." };
  }
  revalidatePath("/minha-lista");
  after(() => avisarListaAlterada(eu.id));
  return { ok: true };
}

/** Usado pelo formulário para mostrar a foto assim que o link é colado. */
export async function previaDoLink(link: string): Promise<string | null> {
  if (!(await getSessao())?.participante) return null;
  return buscarFotoDoLink(link);
}
