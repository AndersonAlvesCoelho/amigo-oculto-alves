"use client";

import {
  CabecalhoPagina,
  CartaoPresente,
  Vazio,
  type ItemPresente,
} from "@/components/familia-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCelular } from "@/hooks/use-celular";
import { Check, Gift, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { excluirPresente, previaDoLink, salvarPresente } from "./actions";

export function MinhaLista({ itens, erro }: { itens: ItemPresente[]; erro: boolean }) {
  const celular = useCelular();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ItemPresente | null>(null);
  const [remover, setRemover] = useState<ItemPresente | null>(null);
  const [excluindo, iniciarExclusao] = useTransition();

  const abrir = (item: ItemPresente | null) => {
    setEditando(item);
    setAberto(true);
  };

  const formulario = (
    <FormPresente
      key={editando?.id ?? "novo"}
      item={editando}
      onSalvo={() => {
        setAberto(false);
        toast.success(editando ? "Presente atualizado!" : "Presente salvo na sua lista!");
      }}
    />
  );
  const titulo = editando ? "Editar presente" : "Adicionar presente";
  const descricao = "Uma pista para quem vai te presentear.";

  return (
    <>
      <CabecalhoPagina
        titulo="Minha lista de desejos"
        subtitulo="Algumas pistas para quem vai te surpreender."
      >
        <Button onClick={() => abrir(null)}>
          <Plus aria-hidden />
          <span className="hidden sm:inline">Adicionar presente</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </CabecalhoPagina>

      {erro ? (
        <Vazio titulo="Algo deu errado" texto="Não foi possível carregar sua lista. Recarregue a página." />
      ) : itens.length ? (
        <div className="gift-grid">
          {itens.map((item) => (
            <CartaoPresente key={item.id} item={item} onEditar={abrir} onExcluir={setRemover} />
          ))}
        </div>
      ) : (
        <Vazio
          titulo="Seu primeiro desejo está esperando"
          texto="Um livro, uma caneca, algo que é a sua cara. Que tal dar uma pista?"
        >
          <Button onClick={() => abrir(null)}>
            <Plus aria-hidden /> Adicionar presente
          </Button>
        </Vazio>
      )}

      {celular ? (
        <Drawer open={aberto} onOpenChange={setAberto}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{titulo}</DrawerTitle>
              <DrawerDescription>{descricao}</DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[75vh] overflow-y-auto px-5 pb-6">{formulario}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{titulo}</DialogTitle>
              <DialogDescription>{descricao}</DialogDescription>
            </DialogHeader>
            {formulario}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={remover !== null} onOpenChange={(v) => !v && setRemover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir presente?</DialogTitle>
            <DialogDescription>“{remover?.nome}” será removido da sua lista.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRemover(null)}>
              Cancelar
            </Button>
            <Button
              disabled={excluindo}
              onClick={() =>
                remover &&
                iniciarExclusao(async () => {
                  const r = await excluirPresente(remover.id);
                  if (r.ok) {
                    toast.success("Presente excluído.");
                    setRemover(null);
                  } else toast.error(r.mensagem);
                })
              }
            >
              {excluindo ? "Excluindo…" : "Excluir presente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormPresente({ item, onSalvo }: { item: ItemPresente | null; onSalvo: () => void }) {
  const [salvando, iniciarSalvar] = useTransition();
  const [buscando, iniciarBusca] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [link, setLink] = useState(item?.link ?? "");
  const [imagem, setImagem] = useState<string | null>(item?.imagem_url ?? null);
  const [linkBuscado, setLinkBuscado] = useState(item?.link ?? "");

  function buscarPrevia() {
    const valor = link.trim();
    if (!valor || valor === linkBuscado) return;
    setLinkBuscado(valor);
    setImagem(null);
    iniciarBusca(async () => setImagem(await previaDoLink(valor)));
  }

  return (
    <form
      action={(formData) => {
        setErro(null);
        iniciarSalvar(async () => {
          const r = await salvarPresente(formData);
          if (r.ok) onSalvo();
          else setErro(r.mensagem);
        });
      }}
    >
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="imagem_url" value={link.trim() === linkBuscado ? (imagem ?? "") : ""} />

      <label className="form-field">
        Nome do presente <span>Obrigatório</span>
        <input
          name="nome"
          required
          maxLength={120}
          defaultValue={item?.nome}
          placeholder="O que você gostaria de ganhar?"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="form-field">
          Preço (R$)
          <input
            name="preco"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={item?.preco ?? ""}
            placeholder="55,00"
          />
        </label>
        <div className="pt-6 text-xs text-muted-foreground">
          Valor sugerido
          <br />
          <strong className="text-primary">R$ 50 a R$ 60</strong>
        </div>
      </div>

      <label className="form-field">
        Link do produto
        <input
          name="link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={buscarPrevia}
          onPaste={(e) => {
            const colado = e.clipboardData.getData("text").trim();
            if (colado) {
              setLink(colado);
              setLinkBuscado(colado);
              setImagem(null);
              iniciarBusca(async () => setImagem(await previaDoLink(colado)));
              e.preventDefault();
            }
          }}
          placeholder="https://loja.com/produto"
        />
        <span>Quando o site permite, a foto do produto aparece sozinha.</span>
      </label>

      {link.trim() && (
        <div className="mb-4 flex items-center gap-3 rounded-md border border-border p-3" aria-live="polite">
          {buscando ? (
            <>
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
              <span className="text-sm text-muted-foreground">Buscando a foto do produto…</span>
            </>
          ) : imagem ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagem} alt="Prévia do produto" className="size-16 rounded-md object-cover" />
              <span className="text-sm text-muted-foreground">Foto encontrada no link</span>
            </>
          ) : (
            <>
              <span className="grid size-16 place-items-center rounded-md bg-accent text-muted-foreground">
                <Gift aria-hidden />
              </span>
              <span className="text-sm text-muted-foreground">
                Sem foto deste site. Vamos usar o ícone de presente.
              </span>
            </>
          )}
        </div>
      )}

      <label className="form-field">
        Descrição
        <textarea
          name="descricao"
          maxLength={500}
          defaultValue={item?.descricao ?? ""}
          placeholder="Cor, tamanho ou uma dica para acertar em cheio…"
        />
      </label>

      {erro && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={salvando || buscando} className="w-full">
        <Check aria-hidden />
        {salvando ? "Salvando…" : item ? "Salvar alterações" : "Adicionar presente"}
      </Button>
    </form>
  );
}
