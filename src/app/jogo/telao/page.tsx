import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Telao } from "./telao";

export const metadata = { title: "Telão · Amigo Oculto Alves" };

/** Tela cheia para espelhar na TV da festa (sem menus). */
export default async function TelaoPage() {
  const sessao = await getSessao();
  if (!sessao?.participante) redirect("/entrar");

  const supabase = await createClient();
  const { count } = await supabase
    .from("participantes")
    .select("id", { count: "exact", head: true });

  return (
    <main className="screen-mode">
      <Telao total={count ?? 0} />
    </main>
  );
}
