import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, Pencil, Trash2 } from "lucide-react";

export type ItemPresente = {
  id: string;
  participante_id: string;
  nome: string;
  preco: number | null;
  descricao: string | null;
  link: string | null;
  imagem_url: string | null;
};

export const dinheiro = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Título da página com subtítulo e, opcionalmente, uma ação à direita. */
export function CabecalhoPagina({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

/** Estado vazio com ícone de presente. */
export function Vazio({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Gift aria-hidden />
      <h2>{titulo}</h2>
      <p>{texto}</p>
      {children}
    </div>
  );
}

/** Cartão de um presente. Com onEditar/onExcluir mostra os botões de edição. */
export function CartaoPresente({
  item,
  onEditar,
  onExcluir,
}: {
  item: ItemPresente;
  onEditar?: (item: ItemPresente) => void;
  onExcluir?: (item: ItemPresente) => void;
}) {
  return (
    <article className="gift-card">
      {item.imagem_url ? (
        // imagem de loja externa: domínio desconhecido, por isso <img> simples
        // eslint-disable-next-line @next/next/no-img-element
        <img className="gift-photo" src={item.imagem_url} alt={item.nome} loading="lazy" />
      ) : (
        <div className="gift-photo">
          <Gift size={50} aria-hidden />
        </div>
      )}
      <div className="gift-info">
        <h3>{item.nome}</h3>
        {item.preco !== null && <span className="price mt-2 block">{dinheiro(item.preco)}</span>}
        <p>{item.descricao || "Uma surpresa escolhida com carinho."}</p>
        <div className="flex items-center justify-between gap-2">
          {item.link ? (
            <Button
              variant="link"
              size="sm"
              className="px-0"
              nativeButton={false}
              render={<a href={item.link} target="_blank" rel="noreferrer noopener" />}
            >
              Ver na loja <ExternalLink aria-hidden />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Sem link de loja</span>
          )}
          {onEditar && (
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                title="Editar presente"
                aria-label={`Editar ${item.nome}`}
                onClick={() => onEditar(item)}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Excluir presente"
                aria-label={`Excluir ${item.nome}`}
                onClick={() => onExcluir?.(item)}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
