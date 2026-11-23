"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { enviarLink, type EstadoEntrar } from "./actions";

const inicial: EstadoEntrar = { status: "inicial" };

export function FormEntrar() {
  const [estado, acao, enviando] = useActionState(enviarLink, inicial);
  // permite voltar ao formulário ("Usar outro e-mail") sem recarregar
  const [estadoVisto, setEstadoVisto] = useState<EstadoEntrar | null>(null);
  const mostrar = estado === estadoVisto ? inicial : estado;

  if (mostrar.status === "enviado") {
    const ativacao = mostrar.envio === "ativacao";
    return (
      <div className="alert-box" role="status">
        <CheckCircle className="mb-3 text-success" aria-hidden />
        <h2 className="text-2xl">Confira seu e-mail.</h2>
        <p className="mt-3">
          {ativacao
            ? "Reenviamos o e-mail de ativação para "
            : "Enviamos um link de acesso para "}
          <strong className="break-all">{mostrar.email}</strong>. Ele vale por
          24 horas.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Não chegou? Olhe a caixa de spam ou promoções.
        </p>
        <Button variant="link" className="mt-3 px-0" onClick={() => setEstadoVisto(estado)}>
          Usar outro e-mail
        </Button>
      </div>
    );
  }

  if (mostrar.status === "nao_ativado") {
    return (
      <div className="alert-box" role="status">
        <Mail className="mb-3" aria-hidden />
        <h2 className="text-2xl">Falta ativar sua conta.</h2>
        <p className="my-4">
          Já enviamos para <strong className="break-all">{mostrar.email}</strong>{" "}
          o e-mail do sorteio, com o link de ativação. Procure por &quot;Seu amigo
          oculto já foi sorteado!&quot;, inclusive no spam.
        </p>
        <form action={acao}>
          <input type="hidden" name="email" value={mostrar.email} />
          <input type="hidden" name="intencao" value="reenviar" />
          <Button type="submit" className="w-full" disabled={enviando}>
            <Mail aria-hidden />
            {enviando ? "Enviando…" : "Reenviar e-mail de ativação"}
          </Button>
        </form>
      </div>
    );
  }

  const erro = mostrar.status === "erro" ? mostrar.mensagem : undefined;

  return (
    <form action={acao}>
      <label className="form-field">
        Seu e-mail
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@email.com"
          defaultValue={mostrar.email}
          required
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? "erro-email" : undefined}
        />
      </label>
      {erro && (
        <div id="erro-email" className="alert-box flex gap-2" role="alert">
          <AlertCircle className="mt-1 shrink-0" size={19} aria-hidden />
          {erro}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={enviando}>
        <Mail aria-hidden />
        {enviando ? "Enviando…" : "Receber link de acesso"}
      </Button>
    </form>
  );
}
