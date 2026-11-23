"use client";

import { motion, useReducedMotion } from "motion/react";

/** Transição suave a cada troca de página dentro do app. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduzir = useReducedMotion();
  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
