"use client";

import { EtiquetaPresente } from "@/components/etiqueta-presente";
import { CirculoFinal } from "@/components/jogo/circulo-final";
import { estourar } from "@/components/jogo/confete";
import { ContagemVotacao } from "@/components/jogo/contagem-votacao";
import { fraseUltimaRodada } from "@/components/jogo/frases";
import { Ranking } from "@/components/jogo/ranking";
import { Roleta } from "@/components/jogo/roleta";
import { useEstadoJogo } from "@/components/jogo/use-estado-jogo";
import { useRoleta } from "@/components/jogo/use-roleta";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle, Clock, Monitor, Orbit, Sparkles, Trophy, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Pessoa = { id: string; nome: string };
type MeuPalpite = { rodada_id: string; chute_id: string; acertou: boolean | null };

export function JogoParticipante({ euId, participantes }: { euId: string; participantes: Pessoa[] }) {
  const { supabase, atual, rodadas, restante, erro } = useEstadoJogo();
  const { giro, limpar, etapaFinal, setEtapaFinal } = useRoleta(supabase);
  const reduzir = useReducedMotion();
  const [palpite, setPalpite] = useState<MeuPalpite | null>(null);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [mudando, setMudando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [revelada, setRevelada] = useState<string | null>(null);

  const rodadaId = atual?.rodada_id;
  const status = atual?.status;

  // Meu palpite na rodada atual (o RLS só mostra os meus)
  useEffect(() => {
    if (!rodadaId) return;
    let ativo = true;
    supabase
      .from("palpites")
      .select("rodada_id, chute_id, acertou")
      .eq("rodada_id", rodadaId)
      .eq("votante_id", euId)
      .maybeSingle()
      .then(({ data }) => ativo && setPalpite(data));
    return () => {
      ativo = false;
    };
  }, [supabase, rodadaId, status, euId]);

  const meuPalpite = palpite?.rodada_id === rodadaId ? palpite : null;
  const acertei = revelada === rodadaId && meuPalpite?.acertou;
  useEffect(() => {
    if (!acertei) return;
    const t = setTimeout(() => estourar("pequeno", { x: 0.5, y: 0.7 }), 600);
    return () => clearTimeout(t);
  }, [acertei]);

  if (giro) return <Roleta giro={giro} onFim={limpar} />;

  if (erro && !rodadas) {
    return <p className="text-destructive">Não foi possível carregar o jogo. Recarregue a página.</p>;
  }
  if (!rodadas) return <div className="skeleton h-96" aria-label="Carregando o jogo" />;

  const total = participantes.length;
  const linkTelao = (
    <div className="mt-10 text-center">
      <Button variant="link" nativeButton={false} render={<Link href="/jogo/telao" target="_blank" />}>
        <Monitor aria-hidden /> Abrir telão
      </Button>
    </div>
  );

  if (!atual) {
    return (
      <div className="game-heading py-20">
        <Clock size={44} className="mx-auto text-muted-foreground" aria-hidden />
        <h1>O jogo ainda não começou</h1>
        <p>Na festa, a primeira rodada aparece aqui sozinha.</p>
      </div>
    );
  }

  const ultimaRodada = atual.ordem >= total - 1;
  const fim = atual.status === "revelada" && ultimaRodada;

  // Depois da última revelação: círculo e ranking, um de cada vez
  if (fim && (etapaFinal === "circulo" || etapaFinal === "ranking")) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={etapaFinal}
            initial={reduzir ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduzir ? undefined : { opacity: 0, y: -16 }}
          >
            {etapaFinal === "circulo" ? <CirculoFinal rodadas={rodadas} /> : <Ranking supabase={supabase} />}
          </motion.div>
        </AnimatePresence>
        <div className="final-botoes">
          {etapaFinal === "circulo" ? (
            <Button onClick={() => setEtapaFinal("ranking")}>
              <Trophy aria-hidden /> Ver o ranking
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setEtapaFinal("circulo")}>
              <Orbit aria-hidden /> Ver o círculo de novo
            </Button>
          )}
        </div>
        {linkTelao}
      </>
    );
  }

  const souRevelador = atual.revelador_id === euId;
  const nomeDe = (id?: string | null) => participantes.find((p) => p.id === id)?.nome;
  // quem já foi revelado como amigo oculto não pode ser tirado de novo
  const tirados = new Set(
    rodadas.filter((r) => r.status === "revelada" && r.amigo_id).map((r) => r.amigo_id as string),
  );
  const escolhaValida = escolha && !tirados.has(escolha) ? escolha : null;

  async function votar() {
    if (!escolhaValida || !rodadaId) return;
    setEnviando(true);
    const { error } = await supabase.rpc("votar", { p_chute: escolhaValida });
    setEnviando(false);
    if (error) {
      toast.error(error.message || "Não foi possível votar.");
      return;
    }
    setPalpite({ rodada_id: rodadaId, chute_id: escolhaValida, acertou: null });
    setMudando(false);
    toast.success("Palpite enviado!");
  }

  const entrada = reduzir
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

  return (
    <>
      <div className="game-heading">
        <span className="eyebrow">
          Jogo ao vivo · rodada {atual.ordem + 1} de {total}
          {ultimaRodada && " · a última!"}
        </span>
        <h1>
          {atual.status === "revelada"
            ? `${atual.revelador_nome} tirou…`
            : souRevelador
              ? "É a sua vez!"
              : `Quem você acha que ${atual.revelador_nome} tirou?`}
        </h1>
        {ultimaRodada && atual.status !== "revelada" && (
          <p className="ironia">{fraseUltimaRodada("votacao", atual.rodada_id)}</p>
        )}
        <p className="flex items-center justify-center gap-2">
          <Users size={18} aria-hidden /> {atual.total_votos} de {total - 1} palpites enviados
        </p>
        {atual.status === "votando" && <ContagemVotacao restante={restante} />}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${atual.rodada_id}-${atual.status}-${souRevelador}-${Boolean(meuPalpite && !mudando)}`} {...entrada}>
          {atual.status === "revelada" ? (
            <div className="text-center">
              <EtiquetaPresente
                key={atual.rodada_id}
                nome={atual.amigo_nome ?? ""}
                legenda={`${atual.revelador_nome} tirou`}
                revelada={revelada === atual.rodada_id}
                onRevelar={() => setRevelada(atual.rodada_id)}
                confete={fim ? "grande" : "pequeno"}
              />
              {revelada === atual.rodada_id && !souRevelador && (
                <motion.p
                  className={`flex items-center justify-center gap-2 text-xl font-semibold ${meuPalpite?.acertou ? "text-success" : "text-muted-foreground"}`}
                  role="status"
                  initial={reduzir ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 14 }}
                >
                  {meuPalpite?.acertou ? <CheckCircle aria-hidden /> : <Sparkles aria-hidden />}
                  {meuPalpite?.acertou
                    ? "Você acertou!"
                    : meuPalpite
                      ? "Não foi dessa vez"
                      : "Você não palpitou nesta rodada"}
                </motion.p>
              )}
              {fim ? (
                <>
                  <p className="ironia mt-4">{fraseUltimaRodada("revelacao", atual.rodada_id)}</p>
                  <div className="final-botoes">
                    <Button onClick={() => setEtapaFinal("circulo")}>
                      <Orbit aria-hidden /> Ver o círculo completo
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-muted-foreground">Aguardando a próxima rodada…</p>
              )}
            </div>
          ) : atual.status === "encerrada" ? (
            <div className="py-16 text-center">
              <Clock className="mx-auto mb-5" size={40} aria-hidden />
              <h2 className="text-2xl">O tempo acabou! Aguardando a revelação…</h2>
              {meuPalpite && (
                <p className="mt-3 text-muted-foreground">
                  Seu palpite: <strong>{nomeDe(meuPalpite.chute_id)}</strong>
                </p>
              )}
            </div>
          ) : souRevelador ? (
            <div className="py-14 text-center">
              <Sparkles size={45} className="mx-auto mb-4 text-ribbon" aria-hidden />
              <h2 className="text-3xl">A família está tentando adivinhar quem você tirou</h2>
              <p className="mt-3 text-muted-foreground">Faça cara de paisagem e não entregue nada!</p>
            </div>
          ) : meuPalpite && !mudando ? (
            <div className="py-14 text-center">
              <CheckCircle size={45} className="mx-auto mb-4 text-success" aria-hidden />
              <h2 className="text-3xl">Palpite enviado</h2>
              <p className="mt-3 text-muted-foreground">
                Você apostou em <strong>{nomeDe(meuPalpite.chute_id)}</strong>. Dá para mudar até o tempo acabar.
              </p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => {
                  setEscolha(meuPalpite.chute_id);
                  setMudando(true);
                }}
              >
                Mudar palpite
              </Button>
            </div>
          ) : (
            <>
              <div className="vote-grid" role="group" aria-label="Escolha seu palpite">
                {participantes
                  .filter((p) => p.id !== atual.revelador_id)
                  .map((p) => {
                    const jaTirado = tirados.has(p.id);
                    return (
                      <Button
                        key={p.id}
                        className={`vote-chip ${jaTirado ? "ja-tirado" : ""}`}
                        variant="outline"
                        aria-pressed={escolhaValida === p.id}
                        disabled={jaTirado}
                        aria-label={jaTirado ? `${p.nome}, já foi tirado` : undefined}
                        onClick={() => setEscolha(p.id)}
                      >
                        {escolhaValida === p.id && <Check aria-hidden />}
                        <span className="vote-chip-nome">
                          {p.id === euId ? `${p.nome} (eu)` : p.nome}
                          {jaTirado && <small>já tirado</small>}
                        </span>
                      </Button>
                    );
                  })}
              </div>
              <div className="vote-actions">
                <Button className="w-full sm:w-auto" disabled={!escolhaValida || enviando} onClick={votar}>
                  <Check aria-hidden />
                  {enviando
                    ? "Enviando…"
                    : escolhaValida
                      ? `Confirmar: ${nomeDe(escolhaValida)}`
                      : "Escolha um nome"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      {linkTelao}
    </>
  );
}
