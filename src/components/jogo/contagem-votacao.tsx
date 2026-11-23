"use client";

import { Timer } from "lucide-react";

const PRAZO = 180; // 3 minutos, igual à função prazo_votacao()

/** Relógio da votação: mm:ss + barra que esvazia. Fica rosa no último meio minuto. */
export function ContagemVotacao({ restante, grande }: { restante: number; grande?: boolean }) {
  const mm = String(Math.floor(restante / 60)).padStart(1, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const urgente = restante <= 30;
  return (
    <div className={`votacao-relogio ${grande ? "grande" : ""} ${urgente ? "urgente" : ""}`} role="timer" aria-live="off">
      <span className="votacao-relogio-tempo">
        <Timer aria-hidden /> {mm}:{ss}
      </span>
      <span className="votacao-relogio-barra" aria-hidden>
        <span style={{ width: `${Math.min(100, (restante / PRAZO) * 100)}%` }} />
      </span>
      <span className="sr-only">{`${mm} minutos e ${ss} segundos para votar`}</span>
    </div>
  );
}
