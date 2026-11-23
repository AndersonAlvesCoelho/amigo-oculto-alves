"use client";

import confetti from "canvas-confetti";

const CORES = ["#E0436A", "#F2B632", "#23306B", "#2F8F6B", "#FFFFFF"];
const DOURADO = ["#F2B632", "#FFD978", "#E0A21B", "#FFFFFF"];

function semMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Estouro de confete a partir de um ponto (0–1 da tela). */
export function estourar(tamanho: "pequeno" | "grande" = "pequeno", origem = { x: 0.5, y: 0.45 }) {
  if (semMovimento()) return;
  const grande = tamanho === "grande";
  confetti({
    particleCount: grande ? 180 : 70,
    spread: grande ? 110 : 70,
    startVelocity: grande ? 55 : 38,
    scalar: grande ? 1.2 : 0.9,
    origin: origem,
    colors: CORES,
    disableForReducedMotion: true,
  });
}

/** Chuva de confete dourado pelas laterais (vencedor / final). */
export function chuvaDourada(duracaoMs = 3500) {
  if (semMovimento()) return;
  const fim = Date.now() + duracaoMs;
  const quadro = () => {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: DOURADO, disableForReducedMotion: true });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: DOURADO, disableForReducedMotion: true });
    if (Date.now() < fim) requestAnimationFrame(quadro);
  };
  quadro();
}
