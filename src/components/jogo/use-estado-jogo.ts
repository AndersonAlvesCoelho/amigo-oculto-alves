"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type StatusRodada = "votando" | "encerrada" | "revelada";

export type Rodada = {
  rodada_id: string;
  ordem: number;
  status: StatusRodada;
  revelador_id: string;
  revelador_nome: string;
  amigo_id: string | null;
  amigo_nome: string | null;
  total_votos: number;
  /** Quando a votação fecha sozinha (3 min após abrir). */
  fim_votacao: string;
};

export type LinhaRanking = { participante_id: string; nome: string; acertos: number };

type Linha = Omit<Rodada, "total_votos"> & { total_votos: number | string; agora: string };

/**
 * Estado do jogo ao vivo (função estado_jogo do banco).
 * Atualiza na hora quando uma rodada muda (Realtime) e a cada 2 s.
 * Também acerta o relógio local com o do servidor, para a contagem regressiva.
 */
export function useEstadoJogo() {
  const supabase = useMemo(() => createClient(), []);
  const [rodadas, setRodadas] = useState<Rodada[] | null>(null);
  const [erro, setErro] = useState(false);
  const [desvio, setDesvio] = useState(0); // servidor - local, em ms
  const [agora, setAgora] = useState(() => Date.now());

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc("estado_jogo");
    if (error) {
      console.error("Falha ao ler o estado do jogo:", error.code, error.message);
      setErro(true);
      return;
    }
    const linhas = (data ?? []) as Linha[];
    setErro(false);
    if (linhas[0]?.agora) setDesvio(new Date(linhas[0].agora).getTime() - Date.now());
    setRodadas(
      linhas.map((r) => ({
        rodada_id: r.rodada_id,
        ordem: r.ordem,
        status: r.status,
        revelador_id: r.revelador_id,
        revelador_nome: r.revelador_nome,
        amigo_id: r.amigo_id,
        amigo_nome: r.amigo_nome,
        total_votos: Number(r.total_votos),
        fim_votacao: r.fim_votacao,
      })),
    );
  }, [supabase]);

  useEffect(() => {
    const primeiro = setTimeout(carregar, 0);
    const timer = setInterval(carregar, 2000);
    const relogio = setInterval(() => setAgora(Date.now()), 250);
    const canal = supabase
      .channel("rodadas-jogo")
      .on("postgres_changes", { event: "*", schema: "public", table: "rodadas" }, () => {
        void carregar();
      })
      .subscribe();
    return () => {
      clearTimeout(primeiro);
      clearInterval(timer);
      clearInterval(relogio);
      supabase.removeChannel(canal);
    };
  }, [supabase, carregar]);

  const ultima = rodadas && rodadas.length ? rodadas[rodadas.length - 1] : null;
  // segundos restantes de votação, pelo relógio do servidor
  const restante = ultima
    ? Math.max(0, Math.ceil((new Date(ultima.fim_votacao).getTime() - (agora + desvio)) / 1000))
    : 0;
  // fecha na hora certa, sem esperar a próxima consulta
  const atual =
    ultima && ultima.status === "votando" && restante === 0
      ? { ...ultima, status: "encerrada" as const }
      : ultima;

  return { supabase, rodadas, atual, restante, erro, recarregar: carregar };
}

export async function lerRanking(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc("ranking");
  if (error) {
    console.error("Falha ao ler o ranking:", error.code, error.message);
    return [];
  }
  return ((data ?? []) as LinhaRanking[]).map((l) => ({ ...l, acertos: Number(l.acertos) }));
}
