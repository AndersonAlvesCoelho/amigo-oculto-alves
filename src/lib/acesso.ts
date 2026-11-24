import { enviarEmail } from "@/lib/email/enviar";
import { emailAcesso, emailAjudante, emailConvite } from "@/lib/email/templates";
import { meuAmigoExibido } from "@/lib/amigo";
import { createAdminClient } from "@/lib/supabase/admin";
import "server-only";

/** Quem pode entrar: um participante ou um ajudante convidado. */
export type Pessoa = {
  participanteId: string | null;
  nome?: string;
  /** Só para ajudantes: nome de quem convidou. */
  convidadoPor?: string;
  email: string;
  authUserId: string | null;
  isAdmin: boolean;
};

export type SituacaoConta = "sem_conta" | "pendente" | "ativa" | "erro";

const SITE = process.env.NEXT_PUBLIC_SITE_URL;

/** Procura o e-mail na lista de participantes e, depois, na de ajudantes. */
export async function buscarPessoa(
  email: string,
): Promise<{ pessoa: Pessoa | null; erro: boolean }> {
  const admin = createAdminClient();

  const participante = await admin
    .from("participantes")
    .select("id, nome, is_admin, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (participante.error) {
    console.error("Falha ao buscar participante:", participante.error);
    return { pessoa: null, erro: true };
  }
  if (participante.data) {
    const p = participante.data;
    return {
      pessoa: {
        participanteId: p.id,
        nome: p.nome,
        email,
        authUserId: p.auth_user_id,
        isAdmin: p.is_admin,
      },
      erro: false,
    };
  }

  const ajudante = await admin
    .from("ajudantes")
    .select("auth_user_id, participantes(nome)")
    .eq("email", email)
    .order("auth_user_id", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (ajudante.error) {
    console.error("Falha ao buscar ajudante:", ajudante.error);
    return { pessoa: null, erro: true };
  }
  if (ajudante.data) {
    return {
      pessoa: {
        participanteId: null,
        email,
        convidadoPor: [ajudante.data.participantes as unknown]
          .flat()
          .map((p) => (p as { nome?: string } | null)?.nome)
          .find(Boolean),
        authUserId: ajudante.data.auth_user_id,
        isAdmin: false,
      },
      erro: false,
    };
  }

  return { pessoa: null, erro: false };
}

/** A conta existe? Já foi ativada (e-mail confirmado pelo clique no link)? */
export async function situacaoConta(
  authUserId: string | null,
): Promise<SituacaoConta> {
  if (!authUserId) return "sem_conta";
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(authUserId);
  if (error) {
    if (error.status === 404) return "sem_conta";
    console.error("Falha ao consultar conta:", error.message);
    return "erro";
  }
  return data.user.email_confirmed_at ? "ativa" : "pendente";
}

/**
 * Gera um link de uso único que aponta para /auth/confirm.
 * - "invite": cria a conta (ainda não ativada) e devolve o link de ativação.
 * - "magiclink": para conta que já existe (ativa ou não).
 */
async function gerarLink(email: string, tipo: "invite" | "magiclink") {
  const admin = createAdminClient();
  const options = { redirectTo: `${SITE}/auth/confirm` };
  const { data, error } =
    tipo === "invite"
      ? await admin.auth.admin.generateLink({ type: "invite", email, options })
      : await admin.auth.admin.generateLink({ type: "magiclink", email, options });

  if (error || !data.properties?.hashed_token) {
    console.error("Falha ao gerar link:", error?.code, error?.message);
    return null;
  }

  const { hashed_token, verification_type } = data.properties;
  const params = new URLSearchParams({
    token_hash: hashed_token,
    type: verification_type,
  });
  return `${SITE}/auth/confirm?${params.toString()}`;
}

/** E-mail do sorteio: cria a conta se preciso e envia o link de ativação. */
export async function enviarConvite(pessoa: Pessoa) {
  const link = await gerarLink(
    pessoa.email,
    pessoa.authUserId ? "magiclink" : "invite",
  );
  if (!link) return false;
  // Ajudante (sem participanteId) recebe o convite de ajudante, não o do sorteio
  if (!pessoa.participanteId) {
    return enviarEmail({
      para: pessoa.email,
      ...emailAjudante({ quemConvidou: pessoa.convidadoPor, link }),
      tipo: "ajudante",
    });
  }
  // quem a pessoa tirou (ou o amigo de fachada, se houver) vai no corpo do e-mail
  const { amigo: amigoExibido } = await meuAmigoExibido(pessoa.participanteId);
  const amigo = amigoExibido?.nome;
  return enviarEmail({
    para: pessoa.email,
    ...emailConvite({ nome: pessoa.nome, link, amigo }),
    tipo: "convite",
    participanteId: pessoa.participanteId,
  });
}

/** Link de acesso para quem já tem a conta ativa. */
export async function enviarAcesso(pessoa: Pessoa) {
  const link = await gerarLink(pessoa.email, "magiclink");
  if (!link) return false;
  return enviarEmail({
    para: pessoa.email,
    ...emailAcesso({ nome: pessoa.nome, link }),
    tipo: "acesso",
    participanteId: pessoa.participanteId,
  });
}

/** Admins não dependem do convite: a conta é criada já ativa. */
export async function garantirContaAdmin(pessoa: Pessoa) {
  if (pessoa.authUserId) return true;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: pessoa.email,
    email_confirm: true,
  });
  if (error && error.code !== "email_exists") {
    console.error("Falha ao criar conta do admin:", error.code, error.message);
    return false;
  }
  return true;
}
