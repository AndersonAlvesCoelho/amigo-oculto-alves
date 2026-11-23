import type { createClient } from "@/lib/supabase/server";
import "server-only";

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type Papel = "da" | "recebe";
export type ConversaRef = { sorteioId: string; papel: Papel };

/**
 * As duas conversas do participante: com quem ele tirou ("da") e com quem
 * o tirou ("recebe"). Cada conversa é a linha do sorteio entre os dois.
 */
export async function minhasConversas(supabase: Supabase, euId: string) {
  const [rpc, minhaLinha] = await Promise.all([
    supabase.rpc("minhas_conversas"),
    supabase.from("sorteio").select("id").eq("quem_da_id", euId).maybeSingle(),
  ]);
  if (rpc.error) {
    console.error("Falha ao listar conversas:", rpc.error.code, rpc.error.message);
    return { conversas: [] as ConversaRef[], erro: true };
  }
  const linhas = (rpc.data ?? []) as { sorteio_id: string; meu_papel: Papel }[];
  const da = linhas.find((l) => l.meu_papel === "da" && l.sorteio_id === minhaLinha.data?.id);
  const recebe = linhas.find((l) => l.meu_papel === "recebe");

  const conversas: ConversaRef[] = [];
  if (da) conversas.push({ sorteioId: da.sorteio_id, papel: "da" });
  if (recebe) conversas.push({ sorteioId: recebe.sorteio_id, papel: "recebe" });
  return { conversas, erro: false };
}

/** Total de mensagens recebidas e ainda não lidas. */
export async function contarNaoLidas(supabase: Supabase, euId: string) {
  const { conversas } = await minhasConversas(supabase, euId);
  if (conversas.length === 0) return 0;
  const { data, error } = await supabase
    .from("mensagens")
    .select("sorteio_id, autor")
    .eq("lida", false)
    .in(
      "sorteio_id",
      conversas.map((c) => c.sorteioId),
    );
  if (error) return 0;
  return data.filter((m) =>
    conversas.some((c) => c.sorteioId === m.sorteio_id && c.papel !== m.autor),
  ).length;
}
