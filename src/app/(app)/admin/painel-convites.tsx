"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, CircleDashed, Clock, Send } from "lucide-react";
import { useActionState } from "react";
import {
  enviarConviteParticipante,
  enviarConvitesPendentes,
  type ResultadoConvite,
} from "./actions";

export type LinhaParticipante = {
  id: string;
  nome: string;
  email: string;
  isAdmin: boolean;
  situacao: "nao_convidado" | "convidado" | "ativo";
};

const SITUACAO = {
  nao_convidado: { texto: "Não convidado", icone: CircleDashed, classe: "text-muted-foreground" },
  convidado: { texto: "Convidado, não ativou", icone: Clock, classe: "text-muted-foreground" },
  ativo: { texto: "Ativo", icone: CheckCircle, classe: "text-success" },
} as const;

function Resultado({ r }: { r: ResultadoConvite }) {
  if (!r) return null;
  return (
    <p role="status" className={`text-sm ${r.ok ? "text-success" : "text-destructive"}`}>
      {r.mensagem}
    </p>
  );
}

export function PainelConvites({
  linhas,
  sorteioFeito,
}: {
  linhas: LinhaParticipante[];
  sorteioFeito: boolean;
}) {
  const [resultado, enviarTodos, enviando] = useActionState<ResultadoConvite>(
    enviarConvitesPendentes,
    null,
  );
  const pendentes = linhas.filter((l) => l.situacao === "nao_convidado").length;
  const ativos = linhas.filter((l) => l.situacao === "ativo").length;

  return (
    <>
      {!sorteioFeito && (
        <div className="alert-box flex gap-3">
          <Clock className="shrink-0" aria-hidden />
          <p>
            O sorteio ainda não foi feito. Rode{" "}
            <code className="text-sm">realizar_sorteio</code> no SQL Editor; os
            convites ficam disponíveis logo depois.
          </p>
        </div>
      )}

      <div className="my-7 flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-1">
          <span className="block text-sm text-muted-foreground">
            {linhas.length} participantes · {ativos}{" "}
            {ativos === 1 ? "conta ativa" : "contas ativas"} · {pendentes} sem convite
          </span>
          <Resultado r={resultado} />
        </div>
        <form action={enviarTodos}>
          <Button type="submit" disabled={!sorteioFeito || pendentes === 0 || enviando}>
            <Send aria-hidden />
            {enviando ? "Enviando convites…" : "Enviar convites pendentes"}
          </Button>
        </form>
      </div>

      <div className="table-list">
        {linhas.map((linha) => (
          <LinhaConvite key={linha.id} linha={linha} sorteioFeito={sorteioFeito} />
        ))}
      </div>
    </>
  );
}

function LinhaConvite({
  linha,
  sorteioFeito,
}: {
  linha: LinhaParticipante;
  sorteioFeito: boolean;
}) {
  const [resultado, acao, enviando] = useActionState(enviarConviteParticipante, null);
  const s = SITUACAO[linha.situacao];
  const Icone = s.icone;

  return (
    <div className="table-row">
      <div className="min-w-0 sm:w-1/3">
        <strong className="text-primary">
          {linha.nome}
          {linha.isAdmin && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">admin</span>
          )}
        </strong>
        <p className="email mt-1 text-sm text-muted-foreground">{linha.email}</p>
      </div>
      <div className="flex flex-col gap-1">
        <span className={`flex items-center gap-2 text-sm ${s.classe}`}>
          <Icone size={17} aria-hidden /> {s.texto}
        </span>
        <Resultado r={resultado} />
      </div>
      <form action={acao}>
        <input type="hidden" name="id" value={linha.id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!sorteioFeito || enviando}
          aria-label={`${linha.situacao === "nao_convidado" ? "Convidar" : "Reenviar convite para"} ${linha.nome}`}
        >
          {enviando ? "Enviando…" : linha.situacao === "nao_convidado" ? "Convidar" : "Reenviar"}
        </Button>
      </form>
    </div>
  );
}
