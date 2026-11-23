"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Rodada } from "./use-estado-jogo";

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];
const iniciais = (nome: string) => {
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
};

/**
 * O círculo do sorteio em órbita: cada pessoa é um ponto no anel, o anel gira
 * devagar e um destaque percorre os pares ("Fulano tirou Ciclano").
 * Com muita gente, só os nomes do par em destaque aparecem; os demais ficam
 * como iniciais. Tocar num ponto mostra o par daquela pessoa.
 */
export function CirculoFinal({ rodadas }: { rodadas: Rodada[] }) {
  const circulos = [...new Set(rodadas.map((r) => r.circulo))].sort();
  const varios = circulos.length > 1;
  return (
    <section className="final-circle" aria-label="Quem tirou quem">
      <div className="game-heading">
        <span className="eyebrow">{varios ? "Os círculos completos" : "O círculo completo"}</span>
        <h2 className="text-3xl">Quem tirou quem</h2>
      </div>
      <ol className="sr-only">
        {rodadas.map((r) => (
          <li key={r.rodada_id}>
            {r.revelador_nome} tirou {r.amigo_nome}
          </li>
        ))}
      </ol>
      <div className={`orbitas ${varios ? "duas" : ""}`}>
        {circulos.map((c) => (
          <Anel
            key={c}
            titulo={varios ? `Círculo ${c}` : undefined}
            rodadas={rodadas.filter((r) => r.circulo === c)}
          />
        ))}
      </div>
    </section>
  );
}

/** Um anel: as pessoas de um círculo, na ordem em que foram reveladas. */
function Anel({ rodadas, titulo }: { rodadas: Rodada[]; titulo?: string }) {
  const reduzir = useReducedMotion();
  const n = rodadas.length;
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || n < 2) return;
    const timer = setInterval(() => setAtivo((i) => (i + 1) % n), 2600);
    return () => clearInterval(timer);
  }, [n, pausado]);

  if (n < 2) return null;

  const muitos = n > 12;
  const tamanho = n > 18 ? 6.2 : n > 12 ? 7.5 : 10; // diâmetro do ponto, em % do quadro
  const R = 40;
  const angulo = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const ponto = (i: number, raio = R) => ({
    x: 50 + raio * Math.cos(angulo(i)),
    y: 50 + raio * Math.sin(angulo(i)),
  });
  // arco do ponto i até o ponto i+1, deixando um respiro em volta de cada ponto
  const passo = (Math.PI * 2) / n;
  const folga = Math.min(passo * 0.32, (tamanho * 0.75) / R);
  const arco = (i: number) => {
    const a1 = angulo(i) + folga;
    const a2 = angulo(i) + passo - folga;
    const p1 = { x: 50 + R * Math.cos(a1), y: 50 + R * Math.sin(a1) };
    const p2 = { x: 50 + R * Math.cos(a2), y: 50 + R * Math.sin(a2) };
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`;
  };

  const giro = reduzir ? {} : { rotate: 360 };
  const contraGiro = reduzir ? {} : { rotate: -360 };
  const tempo = { duration: 140, repeat: Infinity, ease: "linear" as const };
  const par = rodadas[ativo];
  const recebe = (ativo + 1) % n;

  return (
    <div className="orbita-bloco">
      {titulo && <h3 className="orbita-titulo">{titulo}</h3>}
      <div className={`orbita ${muitos ? "muitos" : ""}`} aria-hidden>
        {/* brilho de fundo */}
        <div className="orbita-halo" />

        <motion.div className="absolute inset-0" animate={giro} transition={tempo}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <marker id={`orbita-ponta-${rodadas[0].circulo}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ribbon)" />
              </marker>
            </defs>
            <circle cx="50" cy="50" r={R + 7} fill="none" stroke="var(--border)" strokeWidth="0.25" strokeDasharray="0.6 1.6" />
            <circle cx="50" cy="50" r={R - 9} fill="none" stroke="var(--border)" strokeWidth="0.2" />
            {rodadas.map((r, i) => (
              <motion.path
                key={r.rodada_id}
                d={arco(i)}
                fill="none"
                stroke="var(--ribbon)"
                strokeLinecap="round"
                markerEnd={`url(#orbita-ponta-${rodadas[0].circulo})`}
                initial={reduzir ? false : { pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: i === ativo ? 1 : 0.28,
                  strokeWidth: i === ativo ? 0.9 : 0.45,
                }}
                transition={{
                  pathLength: { delay: 0.4 + i * (2.2 / n), duration: 0.5 },
                  opacity: { duration: 0.4 },
                  strokeWidth: { duration: 0.4 },
                }}
              />
            ))}
          </svg>

          {rodadas.map((r, i) => {
            const p = ponto(i);
            const destaque = i === ativo ? "ativo" : i === recebe ? "recebe" : "";
            return (
              <motion.button
                type="button"
                tabIndex={-1}
                key={r.rodada_id}
                className={`orbita-no ${destaque}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, ["--tam" as string]: `${tamanho}cqi` }}
                initial={reduzir ? false : { opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * (2.2 / n), type: "spring", stiffness: 240, damping: 18 }}
                onClick={() => {
                  setAtivo(i);
                  setPausado(true);
                }}
              >
                <motion.span className="orbita-no-conteudo" animate={contraGiro} transition={tempo}>
                  <span className="orbita-avatar">{iniciais(r.revelador_nome)}</span>
                  <span className="orbita-rotulo">{primeiroNome(r.revelador_nome)}</span>
                </motion.span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* centro: o par em destaque */}
        <div className="orbita-centro">
          <AnimatePresence mode="wait">
            <motion.div
              key={par.rodada_id}
              initial={reduzir ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduzir ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <span className="orbita-centro-de">{par.revelador_nome}</span>
              <span className="orbita-centro-seta">tirou</span>
              <span className="orbita-centro-para">{par.amigo_nome}</span>
            </motion.div>
          </AnimatePresence>
          <span className="orbita-centro-total">
            {n} pessoas · 1 círculo
          </span>
        </div>
      </div>
      {pausado && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          <button type="button" className="underline" onClick={() => setPausado(false)}>
            Voltar a girar os pares
          </button>
        </p>
      )}
    </div>
  );
}
