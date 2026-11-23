import { Button } from "@/components/ui/button";
import { meuAmigoExibido } from "@/lib/amigo";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Gift,
  Heart,
  List,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ContagemFesta } from "./_inicio/contagem-festa";
import { PainelRevelacao } from "./_inicio/painel-revelacao";

function dataDaFesta() {
  const iso = process.env.NEXT_PUBLIC_DATA_FESTA;
  if (!iso || Number.isNaN(new Date(iso).getTime())) return null;
  const d = new Date(iso);
  const fuso = { timeZone: "America/Sao_Paulo" } as const;
  const dia = d.toLocaleDateString("pt-BR", { ...fuso, day: "numeric", month: "long", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { ...fuso, hour: "2-digit", minute: "2-digit" });
  return { iso, texto: `${dia} · ${hora}` };
}

export default async function InicioPage() {
  const sessao = await getSessao();
  const eu = sessao?.participante;
  if (!eu) return null; // o layout já redireciona

  const supabase = await createClient();
  const [{ amigo, erro }, participantes, meusItens, rodadaAberta] = await Promise.all([
    meuAmigoExibido(eu.id),
    supabase.from("participantes").select("id, nome").order("nome"),
    supabase
      .from("itens_desejo")
      .select("id", { count: "exact", head: true })
      .eq("participante_id", eu.id),
    supabase
      .from("rodadas")
      .select("id", { count: "exact", head: true })
      .in("status", ["votando", "encerrada"]),
  ]);

  const familia = participantes.data ?? [];
  const totalPessoas = familia.length;
  const qtdItens = meusItens.count ?? 0;
  const jogoAoVivo = (rodadaAberta.count ?? 0) > 0;
  const festa = dataDaFesta();
  const primeiroNome = eu.nome.split(" ")[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Oi, {primeiroNome} 👋</h1>
          <p>Um presente, um segredo e um encontro cheio de carinho.</p>
        </div>
        <span className="date-pill flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
          <CalendarDays size={15} aria-hidden /> Família Alves · 2026
        </span>
      </div>

      {jogoAoVivo && (
        <Link href="/jogo" className="live-banner">
          <span className="flex items-center gap-3 font-semibold">
            <Sparkles aria-hidden /> O jogo ao vivo começou!
          </span>
          <ArrowRight aria-hidden />
        </Link>
      )}

      <div className="home-grid">
        {erro ? (
          <section className="reveal-panel empty">
            <Gift aria-hidden />
            <h2>Algo deu errado</h2>
            <p>Não foi possível carregar o seu amigo oculto. Tente de novo em instantes.</p>
          </section>
        ) : amigo ? (
          <PainelRevelacao amigo={amigo} />
        ) : (
          <section className="reveal-panel empty">
            <Gift aria-hidden />
            <h2>O sorteio ainda não aconteceu</h2>
            <p>Assim que ele for feito, o seu amigo oculto aparece aqui.</p>
          </section>
        )}

        <div className="side-column">
          {festa && <ContagemFesta iso={festa.iso} dataTexto={festa.texto} />}
          <section className="notice-panel">
            <h2>
              <Bell size={18} aria-hidden /> Novidades da família
            </h2>
            <div className="notice">
              <span className="notice-icon">
                <Users size={17} aria-hidden />
              </span>
              <div>
                Já somos <strong>{totalPessoas} pessoas</strong> nessa troca de carinho.
                <small>Todo mundo pronto para se surpreender!</small>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="quick-section">
        <div className="section-heading">
          <h2>Deixe tudo pronto para a surpresa</h2>
        </div>
        <div className="quick-grid">
          <Link className="quick-card" href="/minha-lista">
            <span className="quick-icon">
              <List aria-hidden />
            </span>
            <div>
              <h3>Minha lista de desejos</h3>
              <p>
                {qtdItens} {qtdItens === 1 ? "presente" : "presentes"} · Dê algumas dicas
              </p>
            </div>
            <ArrowRight className="ml-auto shrink-0" size={17} aria-hidden />
          </Link>
          <Link className="quick-card" href="/conversas">
            <span className="quick-icon">
              <MessageCircle aria-hidden />
            </span>
            <div>
              <h3>Conversas secretas</h3>
              <p>Troque pistas, guarde o segredo</p>
            </div>
            <ArrowRight className="ml-auto shrink-0" size={17} aria-hidden />
          </Link>
          <Link className="quick-card" href="/ajudantes">
            <span className="quick-icon">
              <Heart aria-hidden />
            </span>
            <div>
              <h3>Uma mãozinha?</h3>
              <p>Convide alguém para ajudar</p>
            </div>
            <ArrowRight className="ml-auto shrink-0" size={17} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="family-strip">
        <div className="flex items-center gap-3">
          <div className="avatars" aria-hidden>
            {familia.slice(0, 5).map((p) => (
              <span className="avatar" key={p.id}>
                {p.nome.slice(0, 1)}
              </span>
            ))}
            {totalPessoas > 5 && <span className="avatar">+{totalPessoas - 5}</span>}
          </div>
          <p className="text-sm text-muted-foreground">
            Uma família.{" "}
            <strong className="font-medium text-primary">
              {totalPessoas} histórias para surpreender.
            </strong>
          </p>
        </div>
        <Button variant="link" size="sm" nativeButton={false} render={<Link href="/familia" />}>
          Ver a família <ArrowRight aria-hidden />
        </Button>
      </div>
    </>
  );
}
