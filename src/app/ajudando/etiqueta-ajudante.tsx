"use client";

import { EtiquetaPresente } from "@/components/etiqueta-presente";
import { useState } from "react";

/** Etiqueta do amigo oculto de quem o ajudante ajuda; a lista aparece ao revelar. */
export function EtiquetaAjudante({
  de,
  amigo,
  children,
}: {
  de: string;
  amigo: string;
  children: React.ReactNode;
}) {
  const [revelada, setRevelada] = useState(false);
  return (
    <>
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Amigo oculto de {de}</p>
        <EtiquetaPresente
          nome={amigo}
          legenda={`${de} tirou`}
          revelada={revelada}
          onRevelar={() => setRevelada(true)}
          confete="pequeno"
        />
      </div>
      {revelada && (
        <>
          <h2 className="my-6 text-2xl">Lista de {amigo}</h2>
          {children}
        </>
      )}
    </>
  );
}
