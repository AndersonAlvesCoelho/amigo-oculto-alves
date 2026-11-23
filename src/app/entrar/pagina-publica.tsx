import { Marca } from "@/components/marca";
import { Gift } from "lucide-react";

/** Moldura das telas públicas (entrar, confirmar, erro). */
export function PaginaPublica({
  titulo,
  texto,
  icone,
  children,
}: {
  titulo: string;
  texto: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="public-page">
      <Marca />
      <section className="public-form">
        {icone}
        <h1>{titulo}</h1>
        <p>{texto}</p>
        {children}
        <p className="mt-6 flex justify-center gap-2 text-center text-xs text-muted-foreground">
          <Gift size={14} aria-hidden /> Um segredo só seu. Uma surpresa em família.
        </p>
      </section>
      <span className="text-xs text-muted-foreground">Família Alves · 2026</span>
    </main>
  );
}
