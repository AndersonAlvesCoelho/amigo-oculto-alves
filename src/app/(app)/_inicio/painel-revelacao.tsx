"use client";

import { EtiquetaPresente } from "@/components/etiqueta-presente";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** Cartão principal da Início: etiqueta + valor sugerido + link da lista. */
export function PainelRevelacao({ amigo }: { amigo: { id: string; nome: string } }) {
  const [revelada, setRevelada] = useState(false);

  return (
    <section className="reveal-panel" aria-label="Seu amigo oculto">
      <div className="reveal-intro">
        <span className="eyebrow">Um segredo só seu</span>
        <h2>Quem será seu amigo oculto?</h2>
      </div>
      <EtiquetaPresente
        nome={amigo.nome}
        revelada={revelada}
        onRevelar={() => setRevelada(true)}
        confete="pequeno"
      />
      <div className="reveal-footer">
        <div className="budget">
          Valor sugerido
          <strong>R$ 50 a R$ 60</strong>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/familia/${amigo.id}`} />}
        >
          {revelada ? `Ver a lista de ${amigo.nome}` : "Ver a lista de presentes"}
          <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </section>
  );
}
