"use client";

import { Vazio } from "@/components/familia-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Clock, Heart, Trash2, UserRoundPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  convidarAjudante,
  reenviarConviteAjudante,
  removerAjudante,
} from "./actions";

type Ajudante = { id: string; email: string; ativo: boolean };

export function PainelAjudantes({ ajudantes }: { ajudantes: Ajudante[] }) {
  const [email, setEmail] = useState("");
  const [remover, setRemover] = useState<Ajudante | null>(null);
  const [pendente, iniciar] = useTransition();

  const executar = (
    acao: () => Promise<{ ok: boolean; mensagem: string }>,
    depois?: () => void,
  ) =>
    iniciar(async () => {
      const r = await acao();
      if (r.ok) {
        toast.success(r.mensagem);
        depois?.();
      } else toast.error(r.mensagem);
    });

  return (
    <>
      <div className="alert-box flex gap-3">
        <Heart className="shrink-0" aria-hidden />
        <p>
          Seu ajudante só vê quem você tirou e a lista de presentes dessa
          pessoa. Não vê suas conversas e não pode mudar nada.
        </p>
      </div>

      <form
        className="my-8 flex max-w-2xl flex-col items-end gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          executar(
            () => convidarAjudante(email),
            () => setEmail(""),
          );
        }}
      >
        <label className="form-field mb-0 w-full flex-1">
          E-mail do ajudante
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pessoa@email.com"
          />
        </label>
        <Button className="self-center mt-3" type="submit" disabled={pendente}>
          <UserRoundPlus aria-hidden />
          {pendente ? "Convidando…" : "Convidar ajudante"}
        </Button>
      </form>

      {ajudantes.length ? (
        <div className="table-list">
          {ajudantes.map((a) => (
            <div className="table-row" key={a.id}>
              <div className="min-w-0">
                <strong className="break-all text-base">{a.email}</strong>
                <span
                  className={`mt-2 flex items-center gap-2 text-sm ${a.ativo ? "text-success" : "text-muted-foreground"}`}
                >
                  {a.ativo ? (
                    <CheckCircle size={15} aria-hidden />
                  ) : (
                    <Clock size={15} aria-hidden />
                  )}
                  {a.ativo ? "Ativo" : "Convidado, ainda não entrou"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!a.ativo && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pendente}
                    onClick={() =>
                      executar(() => reenviarConviteAjudante(a.id))
                    }
                  >
                    Reenviar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${a.email}`}
                  title="Remover ajudante"
                  onClick={() => setRemover(a)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Vazio
          titulo="Você ainda não tem ajudantes"
          texto="Pode ser um filho, neto ou alguém de confiança."
        />
      )}

      <Dialog
        open={remover !== null}
        onOpenChange={(v) => !v && setRemover(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover ajudante?</DialogTitle>
            <DialogDescription>
              {remover?.email} não terá mais acesso ao seu amigo oculto.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRemover(null)}>
              Cancelar
            </Button>
            <Button
              disabled={pendente}
              onClick={() =>
                remover &&
                executar(
                  () => removerAjudante(remover.id),
                  () => setRemover(null),
                )
              }
            >
              Remover ajudante
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

