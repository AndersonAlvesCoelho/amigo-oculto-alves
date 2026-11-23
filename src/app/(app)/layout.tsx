import { Marca } from "@/components/marca";
import { NavDesktop, NavInferior } from "@/components/nav-inferior";
import { Button } from "@/components/ui/button";
import { contarNaoLidas } from "@/lib/conversas";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { Heart, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  if (!sessao.participante) redirect(sessao.ajudando ? "/ajudando" : "/entrar");

  const naoLidas = await contarNaoLidas(await createClient(), sessao.participante.id);

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Marca />
          <NavDesktop naoLidas={naoLidas} />
          <div className="header-actions flex items-center gap-2">
            {sessao.participante.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/admin" />}
              >
                <ShieldCheck aria-hidden />
                Admin
              </Button>
            )}
            <span className="mx-1 h-5 border-l border-border" aria-hidden />
            <form action="/auth/sair" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={18} aria-hidden />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      <footer className="footer">
        <span className="flex items-center gap-2">
          <Heart size={13} aria-hidden /> Feito para a nossa família.
        </span>
        <span>Amigo Oculto Alves · 2026</span>
      </footer>

      <NavInferior naoLidas={naoLidas} />
    </>
  );
}
