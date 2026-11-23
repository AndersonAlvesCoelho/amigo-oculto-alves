import { Gift } from "lucide-react";
import Link from "next/link";

/** Logotipo: ícone de presente levemente inclinado + nome do app. */
export function Marca() {
  return (
    <Link href="/" className="brand" aria-label="Amigo Oculto Alves 2026, início">
      <span className="brand-icon">
        <Gift size={27} aria-hidden />
      </span>
      <span>
        <span className="brand-name">Amigo Oculto Alves</span>
        <span className="brand-year block">FAMÍLIA ALVES · 2026</span>
      </span>
    </Link>
  );
}
