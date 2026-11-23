"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { avisarMensagemEnviada } from "./actions";

type Papel = "da" | "recebe";
export type Mensagem = {
  id: string;
  sorteio_id: string;
  autor: Papel;
  texto: string;
  enviada_em: string;
  lida: boolean;
};

const ROTULO: Record<Papel, string> = {
  da: "Com quem você tirou",
  recebe: "Com quem te tirou",
};

const hora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

export function Chat({
  conversas,
  iniciais,
}: {
  conversas: { sorteioId: string; papel: Papel }[];
  iniciais: Mensagem[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [mensagens, setMensagens] = useState(iniciais);
  const [selecionada, setSelecionada] = useState(conversas[0].sorteioId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  const atual = conversas.find((c) => c.sorteioId === selecionada)!;
  const daConversa = mensagens.filter((m) => m.sorteio_id === selecionada);
  const naoLidas = (c: { sorteioId: string; papel: Papel }) =>
    mensagens.filter((m) => m.sorteio_id === c.sorteioId && m.autor !== c.papel && !m.lida).length;

  // Mensagens novas em tempo real
  const ids = conversas.map((c) => c.sorteioId).join(",");
  useEffect(() => {
    const canal = supabase
      .channel(`mensagens-${ids}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `sorteio_id=in.(${ids})` },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((atuais) =>
            atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [supabase, ids]);

  // Marca como lidas as mensagens recebidas na conversa aberta
  const pendentes = daConversa.filter((m) => m.autor !== atual.papel && !m.lida).length;
  useEffect(() => {
    if (pendentes === 0) return;
    let cancelado = false;
    supabase
      .from("mensagens")
      .update({ lida: true })
      .eq("sorteio_id", atual.sorteioId)
      .neq("autor", atual.papel)
      .eq("lida", false)
      .then(({ error }) => {
        if (cancelado || error) return;
        setMensagens((atuais) =>
          atuais.map((m) =>
            m.sorteio_id === atual.sorteioId && m.autor !== atual.papel ? { ...m, lida: true } : m,
          ),
        );
        router.refresh(); // atualiza o selo de não lidas no menu
      });
    return () => {
      cancelado = true;
    };
  }, [pendentes, atual.sorteioId, atual.papel, supabase, router]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [daConversa.length, selecionada]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    setEnviando(true);
    const { data, error } = await supabase
      .from("mensagens")
      .insert({ sorteio_id: atual.sorteioId, autor: atual.papel, texto: conteudo })
      .select("id, sorteio_id, autor, texto, enviada_em, lida")
      .single();
    setEnviando(false);
    if (error) {
      console.error("Falha ao enviar mensagem:", error.code, error.message);
      toast.error("Não foi possível enviar. Tente de novo.");
      return;
    }
    setTexto("");
    void avisarMensagemEnviada(atual.sorteioId);
    setMensagens((atuais) =>
      atuais.some((m) => m.id === data.id) ? atuais : [...atuais, data as Mensagem],
    );
  }

  return (
    <div className="chat-layout">
      <div className="chat-list" role="tablist" aria-label="Conversas">
        {conversas.map((c) => {
          const n = naoLidas(c);
          return (
            <Button
              key={c.sorteioId}
              role="tab"
              aria-selected={c.sorteioId === selecionada}
              variant={c.sorteioId === selecionada ? "secondary" : "ghost"}
              className="chat-option"
              onClick={() => setSelecionada(c.sorteioId)}
            >
              <span>
                <span className="block font-semibold">{ROTULO[c.papel]}</span>
                <span className="mt-2 block text-xs text-muted-foreground">Seu amigo oculto</span>
              </span>
              {n > 0 && (
                <span className="badge" aria-label={`${n} não lidas`}>
                  {n}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <div className="chat-main">
        <div className="chat-title flex items-center gap-3">
          <LockKeyhole size={21} aria-hidden />
          <div>
            <h2 className="text-lg">Seu amigo oculto</h2>
            <p className="text-xs text-muted-foreground">
              {ROTULO[atual.papel]} · o segredo fica entre vocês
            </p>
          </div>
        </div>

        <div className="chat-messages" aria-live="polite">
          {daConversa.length === 0 ? (
            <div className="empty py-10">
              <h2>Uma conversa, muitas pistas</h2>
              <p>Mande um oi para o seu amigo oculto.</p>
            </div>
          ) : (
            daConversa.map((m) => {
              const minha = m.autor === atual.papel;
              return (
                <div key={m.id} className={`bubble ${minha ? "mine" : ""}`}>
                  {!minha && !m.lida && (
                    <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-ribbon">
                      <span className="size-1.5 rounded-full bg-ribbon" aria-hidden />
                      Nova mensagem
                    </span>
                  )}
                  <span className="whitespace-pre-wrap break-words">{m.texto}</span>
                  <small>
                    {hora(m.enviada_em)}
                    {minha && m.lida ? " · Lida" : ""}
                  </small>
                </div>
              );
            })
          )}
          <div ref={fim} />
        </div>

        <form className="chat-compose" onSubmit={enviar}>
          <label className="flex-1">
            <span className="sr-only">Mensagem</span>
            <input
              className="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva uma mensagem…"
              maxLength={1000}
            />
          </label>
          <Button
            size="icon"
            className="size-12"
            type="submit"
            aria-label="Enviar mensagem"
            disabled={enviando || !texto.trim()}
          >
            <Send aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  );
}
