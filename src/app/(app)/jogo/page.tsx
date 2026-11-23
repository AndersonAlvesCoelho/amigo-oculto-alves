import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { JogoParticipante } from "./jogo-participante";

export default async function JogoPage() {
  const eu = (await getSessao())?.participante;
  if (!eu) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("participantes").select("id, nome").order("nome");

  return <JogoParticipante euId={eu.id} participantes={data ?? []} />;
}
