import { createAdminClient } from "@/lib/supabase/admin";
import "server-only";

export type Amigo = { id: string; nome: string };

/**
 * Quem o app mostra como "você tirou" para esta pessoa.
 * Se ela tiver um amigo de fachada configurado, mostra a fachada; senão, o
 * sorteio real. Antes do sorteio, devolve null. Só roda no servidor.
 */
export async function meuAmigoExibido(euId: string): Promise<{ amigo: Amigo | null; erro: boolean }> {
  const admin = createAdminClient();
  const [sorteio, eu] = await Promise.all([
    admin.from("sorteio").select("quem_recebe_id").eq("quem_da_id", euId).maybeSingle(),
    admin.from("participantes").select("amigo_fachada_id").eq("id", euId).maybeSingle(),
  ]);
  if (sorteio.error || eu.error) {
    console.error("Falha ao buscar o amigo oculto:", sorteio.error?.message ?? eu.error?.message);
    return { amigo: null, erro: true };
  }
  if (!sorteio.data) return { amigo: null, erro: false };

  const id = eu.data?.amigo_fachada_id ?? sorteio.data.quem_recebe_id;
  const { data: amigo, error } = await admin
    .from("participantes")
    .select("id, nome")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("Falha ao buscar o nome:", error.message);
  return { amigo, erro: Boolean(error) };
}
