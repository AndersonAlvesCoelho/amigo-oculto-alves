import { CabecalhoPagina } from "@/components/familia-ui";
import { situacaoConta } from "@/lib/acesso";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { PainelAjudantes } from "./painel-ajudantes";

export default async function AjudantesPage() {
  const eu = (await getSessao())?.participante;
  if (!eu) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ajudantes")
    .select("id, email, auth_user_id")
    .eq("participante_id", eu.id)
    .order("convidado_em");
  if (error) console.error("Falha ao listar ajudantes:", error.code, error.message);

  const ajudantes = await Promise.all(
    (data ?? []).map(async (a) => ({
      id: a.id,
      email: a.email,
      ativo: (await situacaoConta(a.auth_user_id)) === "ativa",
    })),
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Uma mãozinha no segredo"
        subtitulo="Convide alguém de confiança para ajudar você."
      />
      <PainelAjudantes ajudantes={ajudantes} />
    </>
  );
}
