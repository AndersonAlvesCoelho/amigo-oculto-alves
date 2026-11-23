"use client";

import { EtiquetaPresente } from "@/components/etiqueta-presente";
import { CirculoFinal } from "@/components/jogo/circulo-final";
import { ContagemVotacao } from "@/components/jogo/contagem-votacao";
import { fraseUltimaRodada } from "@/components/jogo/frases";
import { Ranking } from "@/components/jogo/ranking";
import { Roleta } from "@/components/jogo/roleta";
import { situacaoJogo, useEstadoJogo } from "@/components/jogo/use-estado-jogo";
import { useRoleta } from "@/components/jogo/use-roleta";
import { Clock, Gift } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function Telao({ total }: { total: number }) {
  const { supabase, atual, rodadas, restante } = useEstadoJogo();
  const { giro, limpar, etapaFinal } = useRoleta(supabase);
  const reduzir = useReducedMotion();

  if (giro) return <Roleta giro={giro} onFim={limpar} />;
  if (!rodadas) return null;

  const troca = reduzir
    ? {}
    : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } };

  let conteudo: React.ReactNode;
  let chave: string;
  const { ultimaRodada, fim, circuloCompleto, rodadaNoCirculo } = situacaoJogo(rodadas, atual);

  if (!atual) {
    chave = "espera";
    conteudo = (
      <div className="game-heading">
        <motion.div
          animate={reduzir ? {} : { rotate: [0, -8, 8, -4, 0], y: [0, -10, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
        >
          <Gift size={88} className="mx-auto text-primary" aria-hidden />
        </motion.div>
        <h1>Amigo Oculto Alves</h1>
        <p className="telao-sub">O jogo vai começar em instantes…</p>
      </div>
    );
  } else if (fim && etapaFinal === "circulo") {
    chave = "circulo";
    conteudo = <CirculoFinal rodadas={rodadas} />;
  } else if (fim && etapaFinal === "ranking") {
    chave = "ranking";
    conteudo = <Ranking supabase={supabase} />;
  } else {
    chave = `${atual.rodada_id}-${atual.status}`;
    conteudo = (
      <div className="text-center">
        <div className="game-heading">
          <span className="eyebrow telao-eyebrow">
            Círculo {atual.circulo} · rodada {rodadaNoCirculo} de {atual.tamanho_circulo}
            {ultimaRodada && " · a última do jogo!"}
          </span>
          <h1>
            {atual.status === "revelada" ? `${atual.revelador_nome} tirou…` : `Quem ${atual.revelador_nome} tirou?`}
          </h1>
          {ultimaRodada && (
            <p className="ironia">
              {fraseUltimaRodada(atual.status === "revelada" ? "revelacao" : "votacao", atual.rodada_id)}
            </p>
          )}
        </div>

        {atual.status === "revelada" ? (
          <>
            <EtiquetaPresente
              key={atual.rodada_id}
              nome={atual.amigo_nome ?? ""}
              legenda={`${atual.revelador_nome} tirou`}
              revelada
              onRevelar={() => {}}
              confete="grande"
            />
            {circuloCompleto && !fim && (
              <p className="telao-destaque mt-4">Fim do círculo {atual.circulo}! 🎉</p>
            )}
          </>
        ) : atual.status === "encerrada" ? (
          <div className="py-10">
            <motion.div
              animate={reduzir ? {} : { scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Clock size={72} className="mx-auto mb-6 text-muted-foreground" aria-hidden />
            </motion.div>
            <p className="telao-destaque">Tempo esgotado!</p>
            <p className="telao-sub">{atual.total_votos} palpites. Prepare-se para a revelação…</p>
          </div>
        ) : (
          <div className="py-6" aria-live="polite">
            <strong className="telao-contador">
              <motion.span
                key={atual.total_votos}
                className="inline-block"
                initial={reduzir ? false : { scale: 1.4, color: "#E0436A" }}
                animate={{ scale: 1, color: "#23306B" }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {atual.total_votos}
              </motion.span>
              <span className="telao-contador-total"> / {total - 1}</span>
            </strong>
            <p className="telao-sub">palpites até agora</p>
            <div className="mt-8">
              <ContagemVotacao restante={restante} grande />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={chave} {...troca} transition={{ duration: 0.4 }}>
        {conteudo}
      </motion.div>
    </AnimatePresence>
  );
}
