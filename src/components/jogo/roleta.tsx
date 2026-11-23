"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { estourar } from "./confete";

export type Giro = { id: number; nomes: string[]; vencedor: string };

/**
 * Roleta de quem começa: os nomes passam cada vez mais devagar e param no
 * vencedor (definido pelo banco: posição 0 do círculo).
 */
export function Roleta({ giro, onFim }: { giro: Giro; onFim?: () => void }) {
  const reduzir = useReducedMotion();
  const alvo = Math.max(0, giro.nomes.indexOf(giro.vencedor));
  const [indice, setIndice] = useState(reduzir ? alvo : 0);
  const [parou, setParou] = useState(Boolean(reduzir));
  const fimRef = useRef(onFim);

  useEffect(() => {
    fimRef.current = onFim;
  }, [onFim]);

  useEffect(() => {
    const n = giro.nomes.length;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const terminar = () => {
      setParou(true);
      estourar("grande");
      timers.push(setTimeout(() => fimRef.current?.(), 2200));
    };
    if (reduzir || n === 0) {
      timers.push(setTimeout(terminar, 300));
      return () => timers.forEach(clearTimeout);
    }
    // ~3 voltas + o caminho até o alvo, desacelerando
    const passos = n * 3 + alvo;
    let t = 0;
    for (let s = 1; s <= passos; s++) {
      const progresso = s / passos;
      t += 45 + Math.pow(progresso, 3) * 420;
      const i = s % n;
      timers.push(setTimeout(() => setIndice(i), t));
    }
    timers.push(setTimeout(terminar, t + 150));
    return () => timers.forEach(clearTimeout);
  }, [giro.id, giro.nomes.length, alvo, reduzir]);

  return (
    <div className="roleta" role="status" aria-live="polite">
      <span className="eyebrow">Quem começa a revelar?</span>
      <div className="roleta-janela">
        <motion.p
          key={indice + (parou ? "-fim" : "")}
          className={`roleta-nome ${parou ? "parou" : ""}`}
          initial={reduzir ? false : { y: parou ? 0 : -30, opacity: 0, scale: parou ? 0.7 : 1 }}
          animate={{ y: 0, opacity: 1, scale: parou ? [1.25, 1] : 1 }}
          transition={{ duration: parou ? 0.5 : 0.08 }}
        >
          {giro.nomes[indice] ?? giro.vencedor}
        </motion.p>
      </div>
      <div className="roleta-nomes" aria-hidden>
        {giro.nomes.map((nome, i) => (
          <span key={nome + i} className={i === indice ? "ativo" : undefined}>
            {nome}
          </span>
        ))}
      </div>
      {parou && (
        <motion.p
          className="roleta-legenda"
          initial={reduzir ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {giro.vencedor} abre o jogo!
        </motion.p>
      )}
    </div>
  );
}
