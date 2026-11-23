import { getSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ComandoJogo } from "./comando-jogo";

export default async function AdminJogoPage() {
  const sessao = await getSessao();
  if (!sessao?.participante?.is_admin) redirect("/");

  const admin = createAdminClient();
  const [sorteio, participantes] = await Promise.all([
    admin.from("sorteio").select("id", { count: "exact", head: true }),
    admin.from("participantes").select("nome"),
  ]);

  return (
    <ComandoJogo
      totalRodadas={sorteio.count ?? 0}
      nomes={(participantes.data ?? []).map((p) => p.nome)}
    />
  );
}
