"use client";

import { Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { chuvaDourada } from "./confete";
import { lerRanking, useEstadoJogo, type LinhaRanking } from "./use-estado-jogo";

/** Pódio (sobe 3º → 2º → 1º com chuva dourada) + tabela do ranking final. */
export function Ranking({ supabase }: { supabase: ReturnType<typeof useEstadoJogo>["supabase"] }) {
  const [linhas, setLinhas] = useState<LinhaRanking[] | null>(null);
  const reduzir = useReducedMotion();

  useEffect(() => {
    let ativo = true;
    lerRanking(supabase).then((r) => ativo && setLinhas(r));
    return () => {
      ativo = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!linhas?.length) return;
    const t = setTimeout(() => chuvaDourada(), 1700);
    return () => clearTimeout(t);
  }, [linhas]);

  if (!linhas) return <div className="skeleton mx-auto h-64 max-w-2xl" aria-label="Carregando ranking" />;

  const acertos = (n: number) => `${n} ${n === 1 ? "acerto" : "acertos"}`;
  // ordem de entrada: 3º, 2º, 1º
  const atraso = { 2: 0.2, 1: 0.8, 0: 1.4 } as Record<number, number>;

  return (
    <>
      <div className="game-heading">
        <motion.div
          initial={reduzir ? false : { scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <Trophy className="mx-auto text-gold" size={42} aria-hidden />
        </motion.div>
        <h1>Uma família de bons palpites!</h1>
        <p>O ranking final do nosso amigo oculto</p>
      </div>
      <div className="podium">
        {[1, 0, 2].map((i) => {
          const l = linhas[i];
          if (!l) return null;
          return (
            <motion.div
              key={l.participante_id}
              className={`podium-place ${i === 0 ? "winner" : ""}`}
              initial={reduzir ? false : { opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: atraso[i], type: "spring", stiffness: 140, damping: 16 }}
            >
              <Trophy className="mx-auto" size={i === 0 ? 32 : 23} aria-hidden />
              <span className="mt-2 block font-display text-3xl">{i + 1}º</span>
              <h2>{l.nome}</h2>
              <p className="mt-2 text-sm">{acertos(l.acertos)}</p>
            </motion.div>
          );
        })}
      </div>
      {linhas.length > 3 && (
        <div className="table-list mx-auto max-w-2xl">
          {linhas.slice(3).map((l, i) => (
            <motion.div
              className="table-row"
              key={l.participante_id}
              initial={reduzir ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.9 + i * 0.06 }}
            >
              <span className="w-8 text-muted-foreground">{i + 4}º</span>
              <span className="flex-1">{l.nome}</span>
              <strong>{acertos(l.acertos)}</strong>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
