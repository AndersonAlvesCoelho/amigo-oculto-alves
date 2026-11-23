/** Brincadeiras para a última rodada, quando só sobra uma opção. */
const NA_VOTACAO = [
  "Rodada difícil… só sobrou uma opção 😅",
  "Pense bem. Pense muito bem. (Só tem um nome.)",
  "Prêmio de detetive do ano em jogo aqui.",
];
const NA_REVELACAO = [
  "Que reviravolta! Ninguém poderia prever… a não ser todo mundo.",
  "Chocante! Quem diria? (Todo mundo diria.)",
  "Surpresa nenhuma, emoção total!",
];

/** Escolha estável pela rodada, para não trocar a frase a cada atualização. */
export function fraseUltimaRodada(tipo: "votacao" | "revelacao", semente: string) {
  const lista = tipo === "votacao" ? NA_VOTACAO : NA_REVELACAO;
  let h = 0;
  for (const c of semente) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}
