"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

const UNIDADES = ["dias", "horas", "minutos", "segundos"] as const;

function restante(alvo: number) {
  const s = Math.max(0, Math.floor((alvo - Date.now()) / 1000));
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
}

/** Contagem regressiva até a festa. A data vem do servidor já formatada. */
export function ContagemFesta({ iso, dataTexto }: { iso: string; dataTexto: string }) {
  // null até montar no navegador: evita diferença entre servidor e cliente
  const [valores, setValores] = useState<number[] | null>(null);

  useEffect(() => {
    const alvo = new Date(iso).getTime();
    const tick = () => setValores(restante(alvo));
    const primeiro = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(primeiro);
      clearInterval(timer);
    };
  }, [iso]);

  return (
    <section className="countdown" aria-label="Contagem para a festa">
      <h2>
        <CalendarDays size={21} aria-hidden /> Nosso encontro está chegando
      </h2>
      <p>{dataTexto}</p>
      <div className="countdown-numbers">
        {UNIDADES.map((u, i) => (
          <div className="countdown-unit" key={u}>
            <strong>{valores ? String(valores[i]).padStart(2, "0") : "--"}</strong>
            <span>{u}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
