"use client";

import { ContagemVotacao } from "@/components/jogo/contagem-votacao";
import { Roleta } from "@/components/jogo/roleta";
import { situacaoJogo, useEstadoJogo } from "@/components/jogo/use-estado-jogo";
import { useRoleta } from "@/components/jogo/use-roleta";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dices, Eye, Monitor, Orbit, Play, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { comandoJogo } from "./actions";

type Pessoa = { id: string; nome: string };
type Candidato = { circulo: number; participante_id: string; nome: string; posicao: number };

/** Embaralha só a ordem de exibição dos nomes na roleta. */
function embaralhar<T>(lista: T[]) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const ALEATORIO = "aleatorio";

export function ComandoJogo({ totalRodadas, participantes }: { totalRodadas: number; participantes: Pessoa[] }) {
  const { supabase, atual, rodadas, restante, recarregar } = useEstadoJogo();
  const { giro, girar, limpar, etapaFinal, mostrarFinal } = useRoleta(supabase);
  const [pendente, iniciar] = useTransition();
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [escolha, setEscolha] = useState<string>(ALEATORIO);
  const [quemComeca, setQuemComeca] = useState<string | null>(null);

  const { circuloCompleto, fim, rodadaNoCirculo } = situacaoJogo(rodadas, atual);
  // Início do jogo, ou um círculo acabou de fechar: é preciso escolher quem começa o próximo
  const precisaComecarCirculo = Boolean(rodadas) && (!atual || (circuloCompleto && !fim));

  useEffect(() => {
    if (!precisaComecarCirculo) return;
    let ativo = true;
    supabase.rpc("proximo_circulo").then(({ data, error }) => {
      if (!ativo) return;
      if (error) {
        toast.error("Não foi possível listar o próximo círculo. A migration 009 foi rodada?");
        return;
      }
      setCandidatos((data ?? []) as Candidato[]);
      setEscolha(ALEATORIO);
    });
    return () => {
      ativo = false;
    };
  }, [supabase, precisaComecarCirculo, rodadas?.length]);

  const executar = (acao: "proxima" | "revelar", quem?: string) =>
    iniciar(async () => {
      const r = await comandoJogo(acao, quem);
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.mensagem);
      await recarregar();
    });

  const proximoCirculo = candidatos?.[0]?.circulo ?? (atual ? atual.circulo + 1 : 1);

  // A roleta mostra quem ainda não revelou e para em quem vai começar:
  // escolhido pelo admin; senão, no círculo 1 quem abre o sorteio, no 2 alguém ao acaso.
  const girarRoleta = () => {
    if (!candidatos?.length) return;
    const vencedor =
      escolha !== ALEATORIO
        ? candidatos.find((c) => c.participante_id === escolha)
        : proximoCirculo === 1
          ? (candidatos.find((c) => c.posicao === 0) ?? candidatos[0])
          : candidatos[Math.floor(Math.random() * candidatos.length)];
    if (!vencedor) return;
    const jaRevelaram = new Set((rodadas ?? []).map((r) => r.revelador_id));
    const nomes = embaralhar(participantes.filter((p) => !jaRevelaram.has(p.id)).map((p) => p.nome));
    setQuemComeca(vencedor.participante_id);
    iniciar(async () => {
      await girar(nomes, vencedor.nome);
    });
  };

  const status = atual?.status ?? "aguardando";
  const rotulo = precisaComecarCirculo
    ? atual
      ? `Círculo ${atual.circulo} completo! Hora de começar o círculo ${proximoCirculo}.`
      : "Nenhuma rodada aberta ainda"
    : {
        aguardando: "Nenhuma rodada aberta ainda",
        votando: "Votação aberta: fecha sozinha quando o tempo acabar",
        encerrada: "Tempo esgotado. Pode revelar!",
        revelada: fim ? "Fim de jogo! Todas as rodadas foram reveladas" : "Amigo oculto revelado",
      }[status];

  if (giro) {
    return (
      <Roleta
        giro={giro}
        onFim={() => {
          limpar();
          const quem = quemComeca;
          setQuemComeca(null);
          if (quem) executar("proxima", quem); // abre a 1ª rodada do círculo quando a roleta para
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
          <p>Dois círculos, uma rodada de cada vez.</p>
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
              {atual
                ? `Círculo ${atual.circulo} · rodada ${rodadaNoCirculo} de ${atual.tamanho_circulo} · ${rodadas.length} de ${totalRodadas} no total`
                : `${totalRodadas} rodadas em dois círculos`}
            </span>
            <h1>
              {precisaComecarCirculo
                ? `Quem começa o círculo ${proximoCirculo}?`
                : atual
                  ? `${atual.revelador_nome} vai revelar`
                  : "Pronto para começar"}
            </h1>
            {atual && !precisaComecarCirculo && (
              <p className="text-lg">
                {atual.total_votos} {atual.total_votos === 1 ? "voto recebido" : "votos recebidos"}
              </p>
            )}
            {atual?.status === "votando" && <ContagemVotacao restante={restante} />}
            <div className="alert-box mx-auto max-w-lg" role="status">
              {rotulo}
              {atual?.status === "revelada" && (
                <>
                  {" "}
                  <strong>{atual.revelador_nome}</strong> tirou <strong>{atual.amigo_nome}</strong>.
                </>
              )}
            </div>
          </div>

          {precisaComecarCirculo ? (
            <div className="mx-auto max-w-md">
              <label className="form-field">
                Quem começa a revelar
                <select
                  className="search"
                  value={escolha}
                  onChange={(e) => setEscolha(e.target.value)}
                  disabled={!candidatos?.length}
                >
                  <option value={ALEATORIO}>Deixar a roleta decidir</option>
                  {candidatos?.map((c) => (
                    <option key={c.participante_id} value={c.participante_id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="lg" className="w-full" disabled={pendente || !candidatos?.length} onClick={girarRoleta}>
                <Dices aria-hidden /> Girar a roleta
              </Button>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                A roleta aparece no telão e nos celulares, e a primeira rodada do círculo abre sozinha
                quando ela parar.
              </p>
            </div>
          ) : (
            <div className="game-actions duas">
              <Button
                size="lg"
                disabled={pendente || fim || status !== "revelada"}
                onClick={() => executar("proxima")}
              >
                <Play aria-hidden /> Abrir próxima rodada
              </Button>
              <Button size="lg" disabled={pendente || status !== "encerrada"} onClick={() => executar("revelar")}>
                <Eye aria-hidden /> Revelar
              </Button>
            </div>
          )}

          {fim && (
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
                  <Orbit aria-hidden /> Círculos completos
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
        </>
      )}
    </>
  );
}
