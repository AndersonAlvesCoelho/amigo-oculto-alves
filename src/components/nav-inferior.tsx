"use client";

import { Gift, Home, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/minha-lista", label: "Minha lista", icon: Gift },
  { href: "/familia", label: "Família", icon: Users },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
] as const;

function Abas({ naoLidas }: { naoLidas: number }) {
  const pathname = usePathname();

  return ABAS.map(({ href, label, icon: Icon }) => {
    const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className="nav-link"
        data-status={ativo ? "active" : undefined}
        aria-current={ativo ? "page" : undefined}
      >
        <Icon aria-hidden />
        {label}
        {href === "/conversas" && naoLidas > 0 && (
          <span className="badge" aria-label={`${naoLidas} mensagens não lidas`}>
            {naoLidas}
          </span>
        )}
      </Link>
    );
  });
}

/** Abas no cabeçalho (telas largas). */
export function NavDesktop({ naoLidas = 0 }: { naoLidas?: number }) {
  return (
    <nav className="desktop-nav" aria-label="Navegação principal">
      <Abas naoLidas={naoLidas} />
    </nav>
  );
}

/** Barra fixa no rodapé (celular). */
export function NavInferior({ naoLidas = 0 }: { naoLidas?: number }) {
  return (
    <nav className="mobile-nav" aria-label="Navegação inferior">
      <Abas naoLidas={naoLidas} />
    </nav>
  );
}
