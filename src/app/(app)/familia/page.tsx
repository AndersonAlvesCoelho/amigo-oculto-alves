import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/familia-ui";
import { ListaFamilia } from "./lista-familia";

export default async function FamiliaPage() {
  const eu = (await getSessao())?.participante;
  if (!eu) return null;

  const supabase = await createClient();
  const [participantes, itens] = await Promise.all([
    supabase.from("participantes").select("id, nome").order("nome"),
    supabase.from("itens_desejo").select("participante_id"),
  ]);
  if (participantes.error) console.error("Falha ao listar a família:", participantes.error.message);

  const contagem = new Map<string, number>();
  for (const i of itens.data ?? []) {
    contagem.set(i.participante_id, (contagem.get(i.participante_id) ?? 0) + 1);
  }
  const pessoas = (participantes.data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    itens: contagem.get(p.id) ?? 0,
    souEu: p.id === eu.id,
  }));

  return (
    <>
      <CabecalhoPagina
        titulo="Nossa família"
        subtitulo={`${pessoas.length} pessoas, muitos desejos e um encontro especial.`}
      />
      <ListaFamilia pessoas={pessoas} />
    </>
  );
}
