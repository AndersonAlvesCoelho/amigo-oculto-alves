import { CabecalhoPagina, CartaoPresente, Vazio, type ItemPresente } from "@/components/familia-ui";
import { Button } from "@/components/ui/button";
import { meuAmigoExibido } from "@/lib/amigo";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Gift } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

export default async function PessoaPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = (await getSessao())?.participante;
  if (!eu) return null;

  const { id } = await params;
  const voltar = (
    <Button variant="link" className="mb-5 px-0" nativeButton={false} render={<Link href="/familia" />}>
      <ArrowLeft aria-hidden /> Toda a família
    </Button>
  );
  if (!z.uuid().safeParse(id).success) {
    return (
      <>
        {voltar}
        <Vazio titulo="Pessoa não encontrada" texto="Essa pessoa não está na lista da família." />
      </>
    );
  }

  const supabase = await createClient();
  const [pessoa, itens, meuSorteio] = await Promise.all([
    supabase.from("participantes").select("id, nome").eq("id", id).maybeSingle(),
    supabase
      .from("itens_desejo")
      .select("id, participante_id, nome, preco, descricao, link, imagem_url")
      .eq("participante_id", id)
      .order("criado_em"),
    meuAmigoExibido(eu.id),
  ]);

  if (!pessoa.data) {
    return (
      <>
        {voltar}
        <Vazio titulo="Pessoa não encontrada" texto="Essa pessoa não está na lista da família." />
      </>
    );
  }

  const lista = (itens.data ?? []) as ItemPresente[];
  const souEu = pessoa.data.id === eu.id;
  const euPresenteio = meuSorteio.amigo?.id === pessoa.data.id;

  return (
    <>
      {voltar}
      <CabecalhoPagina
        titulo={souEu ? "A sua lista" : `Lista de ${pessoa.data.nome}`}
        subtitulo={`${lista.length} ${lista.length === 1 ? "presente" : "presentes"} na lista`}
      >
        {souEu && (
          <Button variant="outline" nativeButton={false} render={<Link href="/minha-lista" />}>
            Editar minha lista
          </Button>
        )}
      </CabecalhoPagina>

      {euPresenteio && (
        <div className="alert-box flex items-center gap-3 border-ribbon">
          <Gift size={21} className="text-ribbon" aria-hidden />
          <strong>É você quem presenteia</strong>
          <span className="ml-auto text-sm">R$ 50 a R$ 60</span>
        </div>
      )}

      {lista.length ? (
        <div className="gift-grid">
          {lista.map((item) => (
            <CartaoPresente key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Vazio
          titulo="A lista ainda está vazia"
          texto={`${pessoa.data.nome} ainda está pensando nos desejos. Volte em breve!`}
        />
      )}
    </>
  );
}
