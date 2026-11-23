import { CabecalhoPagina, Vazio } from "@/components/familia-ui";
import { minhasConversas } from "@/lib/conversas";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { Chat, type Mensagem } from "./chat";

export default async function ConversasPage() {
  const eu = (await getSessao())?.participante;
  if (!eu) return null;

  const supabase = await createClient();
  const { conversas, erro } = await minhasConversas(supabase, eu.id);

  const cabecalho = (
    <CabecalhoPagina
      titulo="Conversas secretas"
      subtitulo="Pode trocar pistas. Só não vale contar quem você é."
    />
  );

  if (erro || conversas.length === 0) {
    return (
      <>
        {cabecalho}
        <Vazio
          titulo={erro ? "Algo deu errado" : "As conversas abrem depois do sorteio"}
          texto={
            erro
              ? "Não foi possível carregar as conversas. Recarregue a página."
              : "Assim que o sorteio for feito, você poderá conversar com quem tirou e com quem te tirou."
          }
        />
      </>
    );
  }

  const { data } = await supabase
    .from("mensagens")
    .select("id, sorteio_id, autor, texto, enviada_em, lida")
    .in(
      "sorteio_id",
      conversas.map((c) => c.sorteioId),
    )
    .order("enviada_em");

  return (
    <>
      {cabecalho}
      <Chat conversas={conversas} iniciais={(data ?? []) as Mensagem[]} />
    </>
  );
}
