"use client";

import { estourar } from "@/components/jogo/confete";
import { Gift, LockKeyhole, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

/**
 * Etiqueta de presente (furinho + barbante). Começa fechada ("Toque para
 * revelar") e vira com animação ao ser tocada. O estado fica com quem usa,
 * para o resto da tela poder reagir à revelação.
 */
export function EtiquetaPresente({
  nome,
  revelada,
  onRevelar,
  legenda = "Você tirou",
  confete,
}: {
  nome: string;
  revelada: boolean;
  onRevelar: () => void;
  legenda?: string;
  /** Solta confete ao revelar. */
  confete?: "pequeno" | "grande";
}) {
  const reduzir = useReducedMotion();
  // Na etiqueta vai só o primeiro nome; o nome completo fica no leitor de tela e no "title"
  const nomeCurto = nome.trim().split(/\s+/)[0] ?? nome;
  const longo = nomeCurto.length > 9;

  useEffect(() => {
    if (!revelada || !confete) return;
    const t = setTimeout(() => estourar(confete), 380);
    return () => clearTimeout(t);
  }, [revelada, confete]);

  return (
    <div className="tag-stage">
      <span className="tag-string" aria-hidden />
      <motion.div
        // fechada: balança de leve chamando o toque
        animate={
          revelada || reduzir
            ? { rotate: 0, y: 0 }
            : { rotate: [0, -2.5, 2, -1.5, 0], y: [0, -4, 0] }
        }
        transition={
          revelada || reduzir
            ? { duration: 0.2 }
            : { duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }
        }
      >
        <button
          type="button"
          className={`gift-tag ${revelada ? "revealed" : ""}`}
          onClick={onRevelar}
          aria-label={revelada ? `${legenda} ${nome}` : "Toque para revelar seu amigo oculto"}
        >
          <span className="flex flex-col items-center gap-3" aria-live="polite">
            {revelada ? (
              <>
                <motion.span
                  initial={reduzir ? false : { scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 14 }}
                >
                  <Sparkles className="tag-symbol" aria-hidden />
                </motion.span>
                <span className="tag-caption">{legenda}</span>
                <motion.span
                  className={`tag-name ${longo ? "longo" : ""}`}
                  title={nome}
                  initial={reduzir ? false : { opacity: 0, scale: 0.6, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 220, damping: 15 }}
                >
                  {nomeCurto}
                </motion.span>
              </>
            ) : (
              <>
                <Gift className="tag-symbol" aria-hidden />
                <span className="font-display text-xl font-medium">Toque para revelar</span>
                <span className="tag-caption flex items-center gap-1.5">
                  <LockKeyhole size={12} aria-hidden /> Nosso pequeno segredo
                </span>
              </>
            )}
          </span>
        </button>
      </motion.div>
    </div>
  );
}
