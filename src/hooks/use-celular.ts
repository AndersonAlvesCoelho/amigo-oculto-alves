"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(max-width: 760px)";

function assinar(aviso: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}

/** true em telas estreitas (mesmo ponto de quebra do CSS). */
export function useCelular() {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
