import { Button } from "@/components/ui/button";
import { getSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import { Play } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PainelConvites, type LinhaParticipante } from "./painel-convites";

export default async function AdminPage() {
  const sessao = await getSessao();
  if (!sessao?.participante?.is_admin) redirect("/");

  const admin = createAdminClient();
  const [participantes, sorteio, usuarios, convites, ajudantes] = await Promise.all([
    admin
      .from("participantes")
      .select("id, nome, email, is_admin, auth_user_id")
      .order("nome"),
    admin.from("sorteio").select("id", { count: "exact", head: true }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("log_emails").select("email_destino").eq("tipo", "convite").eq("status", "enviado"),
    admin.from("ajudantes").select("participante_id, email").order("convidado_em"),
  ]);
  const recebeuConvite = new Set((convites.data ?? []).map((c) => c.email_destino));

  if (participantes.error || sorteio.error || usuarios.error) {
    console.error(
      "Falha ao carregar o admin:",
      participantes.error ?? sorteio.error ?? usuarios.error,
    );
    return (
      <div>
        <h1>Administração</h1>
        <p className="mt-2 text-destructive">
          Não foi possível carregar os dados. Veja o terminal.
        </p>
      </div>
    );
  }

  const confirmados = new Map(
    usuarios.data.users.map((u) => [u.id, Boolean(u.email_confirmed_at)]),
  );

  const linhas: LinhaParticipante[] = participantes.data.map((p) => {
    const temConta = p.auth_user_id !== null && confirmados.has(p.auth_user_id);
    return {
      id: p.id,
      nome: p.nome,
      email: p.email,
      isAdmin: p.is_admin,
      conviteEnviado: recebeuConvite.has(p.email),
      ajudantes: (ajudantes.data ?? [])
        .filter((a) => a.participante_id === p.id)
        .map((a) => a.email),
      situacao: !temConta
        ? "nao_convidado"
        : confirmados.get(p.auth_user_id!)
          ? "ativo"
          : "convidado",
    };
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Administração</h1>
          <p>Todo mundo junto, nenhum convite esquecido.</p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/jogo" />}
        >
          <Play aria-hidden />
          Jogo ao vivo
        </Button>
      </div>
      <PainelConvites
        linhas={linhas}
        sorteioFeito={(sorteio.count ?? 0) > 0}
      />
    </>
  );
}
