"use server";

import {
  buscarPessoa,
  enviarAcesso,
  enviarConvite,
  garantirContaAdmin,
  situacaoConta,
} from "@/lib/acesso";
import { enviouHaPouco } from "@/lib/email/enviar";
import { z } from "zod";

export type EstadoEntrar = {
  status: "inicial" | "enviado" | "nao_ativado" | "erro";
  /** No status "enviado": qual e-mail saiu. */
  envio?: "acesso" | "ativacao";
  mensagem?: string;
  email?: string;
};

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
});

const ERRO_GENERICO =
  "Não foi possível enviar agora. Tente de novo em instantes.";

export async function enviarLink(
  _estado: EstadoEntrar,
  formData: FormData,
): Promise<EstadoEntrar> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "erro", mensagem: parsed.error.issues[0].message };
  }
  const { email } = parsed.data;
  const reenviarAtivacao = formData.get("intencao") === "reenviar";

  // 1. Está na lista?
  const { pessoa, erro } = await buscarPessoa(email);
  if (erro) return { status: "erro", mensagem: ERRO_GENERICO, email };
  if (!pessoa) {
    return {
      status: "erro",
      mensagem:
        "Esse e-mail não está na lista do amigo oculto. Confira se digitou certo.",
      email,
    };
  }

  // 2. No máximo 1 e-mail por minuto para o mesmo endereço
  if (await enviouHaPouco(email)) {
    return {
      status: "erro",
      mensagem:
        "Acabamos de enviar um e-mail para você. Espere um minuto antes de pedir outro.",
      email,
    };
  }

  // 3. Admin: sempre recebe o link de acesso, mesmo antes do sorteio
  if (pessoa.isAdmin) {
    const ok = (await garantirContaAdmin(pessoa)) && (await enviarAcesso(pessoa));
    return ok
      ? { status: "enviado", envio: "acesso", email }
      : { status: "erro", mensagem: ERRO_GENERICO, email };
  }

  // 4. Ainda não foi convidado (o convite só sai depois do sorteio)
  const situacao = await situacaoConta(pessoa.authUserId);
  if (situacao === "erro") return { status: "erro", mensagem: ERRO_GENERICO, email };
  if (situacao === "sem_conta") {
    return {
      status: "erro",
      mensagem:
        "O sorteio ainda não aconteceu. Você vai receber um e-mail assim que ele for feito.",
      email,
    };
  }

  // 5. Convidado, mas ainda não ativou: orienta e permite reenviar
  if (situacao === "pendente") {
    if (!reenviarAtivacao) return { status: "nao_ativado", email };
    const ok = await enviarConvite(pessoa);
    return ok
      ? { status: "enviado", envio: "ativacao", email }
      : { status: "erro", mensagem: ERRO_GENERICO, email };
  }

  // 6. Conta ativa: link de acesso
  const ok = await enviarAcesso(pessoa);
  return ok
    ? { status: "enviado", envio: "acesso", email }
    : { status: "erro", mensagem: ERRO_GENERICO, email };
}
