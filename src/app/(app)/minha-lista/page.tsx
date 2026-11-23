import type { ItemPresente } from "@/components/familia-ui";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { MinhaLista } from "./minha-lista";

export default async function MinhaListaPage() {
  const eu = (await getSessao())?.participante;
  if (!eu) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_desejo")
    .select("id, participante_id, nome, preco, descricao, link, imagem_url")
    .eq("participante_id", eu.id)
    .order("criado_em");
  if (error) console.error("Falha ao carregar a lista:", error.code, error.message);

  return <MinhaLista itens={(data ?? []) as ItemPresente[]} erro={Boolean(error)} />;
}
