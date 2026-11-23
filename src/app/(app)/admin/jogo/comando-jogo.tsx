"use client";

import { Roleta } from "@/components/jogo/roleta";
import { useEstadoJogo } from "@/components/jogo/use-estado-jogo";
import { useRoleta } from "@/components/jogo/use-roleta";
import { Button } from "@/components/ui/button";
import { ContagemVotacao } from "@/components/jogo/contagem-votacao";
import { ArrowLeft, Dices, Eye, Monitor, Orbit, Play, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { comandoJogo } from "./actions";

/** Embaralha só a ordem de exibição dos nomes na roleta. */
function embaralhar<T>(lista: T[]) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function ComandoJogo({ totalRodadas, nomes }: { totalRodadas: number; nomes: string[] }) {
  const { supabase, atual, rodadas, restante, recarregar } = useEstadoJogo();
  const { giro, girar, limpar, etapaFinal, mostrarFinal } = useRoleta(supabase);
  const [pendente, iniciar] = useTransition();

  const executar = (acao: "proxima" | "revelar") =>
    iniciar(async () => {
      const r = await comandoJogo(acao);
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.mensagem);
      await recarregar();
    });

  // Roleta: o resultado vem do banco (posição 0 do círculo)
  const girarRoleta = () =>
    iniciar(async () => {
      const { data, error } = await supabase.rpc("primeiro_revelador");
      if (error || !data) {
        toast.error("Não foi possível preparar a roleta. A migration 005 foi rodada?");
        return;
      }
      await girar(embaralhar(nomes), data as string);
    });

  const status = atual?.status ?? "aguardando";
  const acabou = atual?.status === "revelada" && atual.ordem >= totalRodadas - 1;
  const rotulo = {
    aguardando: "Nenhuma rodada aberta ainda",
    votando: "Votação aberta: fecha sozinha quando o tempo acabar",
    encerrada: "Tempo esgotado. Pode revelar!",
    revelada: acabou ? "Fim de jogo! Todas as rodadas foram reveladas" : "Amigo oculto revelado",
  }[status];

  if (giro) {
    return (
      <Roleta
        giro={giro}
        onFim={() => {
          limpar();
          executar("proxima"); // abre a rodada 1 logo depois da roleta
        }}
      />
    );
  }

  return (
    <>
      <Button variant="link" className="mb-5 px-0" nativeButton={false} render={<Link href="/admin" />}>
        <ArrowLeft aria-hidden /> Administração
      </Button>

      <div className="page-heading">
        <div>
          <h1>Comando do jogo</h1>
          <p>Uma rodada de cada vez. Um segredo de cada pessoa.</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/jogo/telao" target="_blank" />}>
          <Monitor aria-hidden /> Abrir telão
        </Button>
      </div>

      {totalRodadas === 0 ? (
        <div className="alert-box">O sorteio ainda não foi feito. O jogo só começa depois dele.</div>
      ) : !rodadas ? (
        <div className="skeleton h-64" aria-label="Carregando" />
      ) : (
        <>
          <div className="game-heading">
            <span className="eyebrow">
              {atual ? `Rodada ${atual.ordem + 1} de ${totalRodadas}` : `${totalRodadas} rodadas`}
            </span>
            <h1>{atual ? `${atual.revelador_nome} vai revelar` : "Pronto para começar"}</h1>
            {atual && (
              <p className="text-lg">
                {atual.total_votos} {atual.total_votos === 1 ? "voto recebido" : "votos recebidos"}
              </p>
            )}
            {atual?.status === "votando" && <ContagemVotacao restante={restante} />}
            <div className="alert-box mx-auto max-w-lg" role="status">
              {rotulo}
              {atual?.status === "revelada" && (
                <>
                  : <strong>{atual.revelador_nome}</strong> tirou <strong>{atual.amigo_nome}</strong>
                </>
              )}
            </div>
          </div>

          <div className="game-actions duas">
            {atual ? (
              <Button
                size="lg"
                disabled={pendente || acabou || status !== "revelada"}
                onClick={() => executar("proxima")}
              >
                <Play aria-hidden /> Abrir próxima rodada
              </Button>
            ) : (
              <Button size="lg" disabled={pendente} onClick={girarRoleta}>
                <Dices aria-hidden /> Girar a roleta
              </Button>
            )}
            <Button size="lg" disabled={pendente || status !== "encerrada"} onClick={() => executar("revelar")}>
              <Eye aria-hidden /> Revelar
            </Button>
          </div>
          {acabou && (
            <div className="mt-10 text-center">
              <h2 className="text-2xl">Telão depois do fim</h2>
              <p className="mt-1 text-muted-foreground">Escolha o que aparece no telão (e nos celulares).</p>
              <div className="final-botoes">
                <Button
                  variant={!etapaFinal || etapaFinal === "revelacao" ? "default" : "outline"}
                  onClick={() => mostrarFinal("revelacao")}
                >
                  <Sparkles aria-hidden /> Última revelação
                </Button>
                <Button
                  variant={etapaFinal === "circulo" ? "default" : "outline"}
                  onClick={() => mostrarFinal("circulo")}
                >
                  <Orbit aria-hidden /> Círculo completo
                </Button>
                <Button
                  variant={etapaFinal === "ranking" ? "default" : "outline"}
                  onClick={() => mostrarFinal("ranking")}
                >
                  <Trophy aria-hidden /> Ranking
                </Button>
              </div>
            </div>
          )}
          {!atual && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              A roleta aparece no telão e nos celulares, e a primeira rodada abre sozinha quando ela parar.
            </p>
          )}
        </>
      )}
    </>
  );
}
