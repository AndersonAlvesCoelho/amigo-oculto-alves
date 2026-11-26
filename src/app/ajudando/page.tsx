import { CartaoPresente, Vazio, type ItemPresente } from "@/components/familia-ui";
import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { getSessao } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { MinhaLista } from "../(app)/minha-lista/minha-lista";
import { EtiquetaAjudante } from "./etiqueta-ajudante";

export default async function AjudandoPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.participante) redirect("/");
  if (!sessao.ajudando) redirect("/entrar");

  const supabase = await createClient();
  // Quem eu ajudo (o RLS só mostra as linhas do meu login)
  const { data: vinculos } = await supabase
    .from("ajudantes")
    .select("participante_id")
    .eq("auth_user_id", sessao.userId);
  const ids = [...new Set((vinculos ?? []).map((v) => v.participante_id))];

  const [pessoas, sorteios] = await Promise.all([
    supabase.from("participantes").select("id, nome").in("id", ids),
    supabase.from("sorteio").select("quem_da_id, quem_recebe_id").in("quem_da_id", ids),
  ]);
  const amigosIds = (sorteios.data ?? []).map((s) => s.quem_recebe_id);
  const [amigos, itens] = await Promise.all([
    supabase.from("participantes").select("id, nome").in("id", amigosIds),
    supabase
      .from("itens_desejo")
      .select("id, participante_id, nome, preco, descricao, link, imagem_url")
      .in("participante_id", [...amigosIds, ...ids])
      .order("criado_em"),
  ]);

  const nome = (lista: { id: string; nome: string }[] | null, id?: string) =>
    lista?.find((p) => p.id === id)?.nome;

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Marca />
          <form action="/auth/sair" method="post">
            <Button type="submit" variant="ghost" size="icon" aria-label="Sair" title="Sair">
              <LogOut size={18} aria-hidden />
            </Button>
          </form>
        </div>
      </header>
      <main className="page">
        {(pessoas.data ?? []).map((p) => {
          const sorteio = sorteios.data?.find((s) => s.quem_da_id === p.id);
          const amigo = nome(amigos.data, sorteio?.quem_recebe_id);
          const todos = (itens.data ?? []) as ItemPresente[];
          const lista = todos.filter((i) => i.participante_id === sorteio?.quem_recebe_id);
          const listaDele = todos.filter((i) => i.participante_id === p.id);
          const primeiro = p.nome.split(" ")[0];
          return (
            <section key={p.id} className="mb-14">
              <div className="page-heading">
                <div>
                  <h1>Você está ajudando {p.nome}</h1>
                  <p>
                    Ajude a escolher o presente e a montar a lista de desejos de {primeiro}. Só não
                    vale contar o segredo!
                  </p>
                </div>
              </div>
              {sorteio && amigo ? (
                <EtiquetaAjudante de={p.nome} amigo={amigo}>
                  {lista.length ? (
                    <div className="gift-grid">
                      {lista.map((i) => (
                        <CartaoPresente key={i.id} item={i} />
                      ))}
                    </div>
                  ) : (
                    <Vazio
                      titulo="A lista ainda está vazia"
                      texto={`${amigo} ainda não colocou presentes na lista.`}
                    />
                  )}
                </EtiquetaAjudante>
              ) : (
                <Vazio
                  titulo="O sorteio ainda não aconteceu"
                  texto={`Quando ele for feito, você verá aqui quem ${p.nome} tirou.`}
                />
              )}

              <div className="mt-14">
                <MinhaLista
                  itens={listaDele}
                  erro={Boolean(itens.error)}
                  participanteId={p.id}
                  nomeDono={primeiro}
                  titulo={`Lista de desejos de ${primeiro}`}
                  subtitulo={`O que ${primeiro} gostaria de ganhar. Você pode adicionar, editar e excluir.`}
                />
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
