"use client";

import { useEffect, useRef, useState } from "react";
import type { Giro } from "./roleta";
import type { useEstadoJogo } from "./use-estado-jogo";

type Supabase = ReturnType<typeof useEstadoJogo>["supabase"];
export type EtapaFinal = "revelacao" | "circulo" | "ranking";

/**
 * Canal ao vivo do jogo, comandado pelo admin:
 *  - "girar": roleta de quem começa
 *  - "final": o que o telão mostra depois da última revelação
 */
export function useRoleta(supabase: Supabase) {
  const [giro, setGiro] = useState<Giro | null>(null);
  const [etapaFinal, setEtapaFinal] = useState<EtapaFinal | null>(null);
  const canalRef = useRef<ReturnType<Supabase["channel"]> | null>(null);

  useEffect(() => {
    const canal = supabase
      .channel("jogo-roleta", { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "girar" }, ({ payload }) => setGiro(payload as Giro))
      .on("broadcast", { event: "final" }, ({ payload }) =>
        setEtapaFinal((payload as { etapa: EtapaFinal }).etapa),
      )
      .subscribe();
    canalRef.current = canal;
    return () => {
      canalRef.current = null;
      supabase.removeChannel(canal);
    };
  }, [supabase]);

  async function girar(nomes: string[], vencedor: string) {
    const payload: Giro = { id: Date.now(), nomes, vencedor };
    await canalRef.current?.send({ type: "broadcast", event: "girar", payload });
  }

  async function mostrarFinal(etapa: EtapaFinal) {
    await canalRef.current?.send({ type: "broadcast", event: "final", payload: { etapa } });
  }

  return { giro, girar, limpar: () => setGiro(null), etapaFinal, setEtapaFinal, mostrarFinal };
}
