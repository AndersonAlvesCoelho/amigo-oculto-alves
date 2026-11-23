import "server-only";

type Email = { assunto: string; html: string; texto: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amigoocultoalves.com.br";
const SITE_CURTO = SITE.replace(/^https?:\/\//, "");

// Paleta do app
const ANIL = "#23306B";
const FITA = "#E0436A";
const PAPEL = "#F6F7FB";
const LINHA = "#DCDFEA";
const TEXTO = "#1E2550";
const SUAVE = "#5B6188";

function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const primeiroNome = (nome?: string) => nome?.trim().split(/\s+/)[0];
const saudacao = (nome?: string) => (primeiroNome(nome) ? `Oi, ${primeiroNome(nome)}!` : "Oi!");

type Moldura = {
  /** Linha pequena acima do título (ex.: "O sorteio saiu"). */
  selo: string;
  titulo: string;
  paragrafos: string[];
  /** Destaque opcional (ex.: "7" + "dias para a festa"). */
  destaque?: { numero: string; legenda: string };
  botao: string;
  link: string;
  observacao: string;
};

/**
 * Moldura comum: minimalista, cartão branco, marca com uma pequena etiqueta
 * que balança (Apple Mail, iOS e outros que aceitam animação CSS; no Gmail
 * fica parada). Só tabelas e estilos inline + um <style> opcional.
 */
function moldura(m: Moldura) {
  const paragrafos = m.paragrafos
    .map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:${TEXTO};">${p}</p>`)
    .join("");

  const destaque = m.destaque
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
        <tr>
          <td style="padding:14px 20px;border:1px solid ${LINHA};border-radius:12px;">
            <span style="font-size:36px;line-height:1;font-weight:700;color:${ANIL};">${m.destaque.numero}</span>
            <span style="font-size:14px;color:${SUAVE};padding-left:8px;">${m.destaque.legenda}</span>
          </td>
        </tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<style>
  @keyframes balanco { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
  @keyframes surgir { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .etiqueta { display: inline-block; transform-origin: 50% 0; animation: balanco 2.8s ease-in-out infinite; }
  .cartao { animation: surgir .6s ease-out both; }
  .botao:hover { background: #1A2454 !important; }
  @media (prefers-reduced-motion: reduce) { .etiqueta, .cartao { animation: none !important; } }
  @media (max-width: 520px) { .miolo { padding: 28px 22px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${PAPEL};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPEL};padding:32px 12px;">
    <tr><td align="center">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cartao" style="max-width:520px;background:#FFFFFF;border:1px solid ${LINHA};border-radius:16px;">
        <tr><td class="miolo" style="padding:34px 36px 30px;">

          <!-- marca -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <span class="etiqueta" style="display:inline-block;width:30px;height:20px;background:${ANIL};border-radius:4px 4px 4px 4px;position:relative;text-align:left;">
                  <span style="display:inline-block;width:6px;height:6px;margin:7px 0 0 5px;background:#FFFFFF;border-radius:50%;"></span>
                </span>
              </td>
              <td style="vertical-align:middle;font-size:15px;font-weight:700;color:${ANIL};letter-spacing:.2px;">
                Amigo Oculto Alves
              </td>
            </tr>
          </table>

          <div style="font-size:12px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:${SUAVE};">${m.selo}</div>
          <div style="width:32px;height:3px;background:${FITA};border-radius:2px;margin:10px 0 16px;font-size:0;line-height:0;">&nbsp;</div>
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.3;font-weight:700;color:${ANIL};">${m.titulo}</h1>

          ${paragrafos}
          ${destaque}

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 26px;">
            <tr><td style="border-radius:10px;background:${ANIL};">
              <a class="botao" href="${m.link}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;background:${ANIL};">${m.botao} &rarr;</a>
            </td></tr>
          </table>

          <p style="margin:0;padding-top:18px;border-top:1px solid ${LINHA};font-size:13px;line-height:1.55;color:${SUAVE};">${m.observacao}</p>
        </td></tr>
      </table>

      <p style="margin:18px 0 0;font-size:12px;color:${SUAVE};">
        Família Alves · 2026 · <a href="${SITE}" style="color:${SUAVE};">${SITE_CURTO}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

const textoPuro = (linhas: (string | false | undefined)[]) =>
  linhas.filter((l) => l !== false && l !== undefined).join("\n");

const OBS_LINK = `O link vale por 24 horas e só funciona uma vez. Se ele vencer, entre em <a href="${SITE}/entrar" style="color:${ANIL};">${SITE_CURTO}</a> com este e-mail e peça outro.`;

/** Primeiro e-mail: avisa do sorteio e ativa a conta. Nunca traz o nome sorteado. */
export function emailConvite({ nome, link }: { nome?: string; link: string }): Email {
  const oi = saudacao(nome);
  return {
    assunto: "Seu amigo oculto já foi sorteado",
    html: moldura({
      selo: "O sorteio saiu",
      titulo: "Tem alguém esperando o seu presente",
      paragrafos: [
        escapar(oi),
        "O sorteio do Amigo Oculto Alves foi feito. Seu amigo oculto já está escolhido, guardado numa etiqueta só sua.",
        "Ative sua conta para descobrir quem você tirou e montar a sua lista de presentes.",
      ],
      destaque: { numero: "R$ 50–60", legenda: "valor sugerido" },
      botao: "Descobrir quem eu tirei",
      link,
      observacao: OBS_LINK,
    }),
    texto: textoPuro([
      oi,
      "",
      "O sorteio do Amigo Oculto Alves foi feito e tem alguém esperando o seu presente.",
      "Abra o link para ativar sua conta e descobrir quem você tirou:",
      link,
      "",
      "Valor sugerido: R$ 50 a R$ 60.",
      "O link vale por 24 horas e só funciona uma vez.",
      `Se ele vencer, entre em ${SITE}/entrar com este e-mail e peça outro.`,
    ]),
  };
}

/** Link de acesso para quem já ativou a conta (outro aparelho, sessão perdida). */
export function emailAcesso({ nome, link }: { nome?: string; link: string }): Email {
  const oi = saudacao(nome);
  return {
    assunto: "Seu link de acesso – Amigo Oculto Alves",
    html: moldura({
      selo: "Link de acesso",
      titulo: "Bem-vindo de volta",
      paragrafos: [escapar(oi), "Use o botão abaixo para entrar no Amigo Oculto Alves. Seu segredo continua bem guardado."],
      botao: "Entrar",
      link,
      observacao: "O link vale por 24 horas e só funciona uma vez. Se você não pediu este e-mail, pode ignorá-lo.",
    }),
    texto: textoPuro([
      oi,
      "",
      "Abra o link abaixo para entrar no Amigo Oculto Alves:",
      link,
      "",
      "O link vale por 24 horas e só funciona uma vez. Se você não pediu este e-mail, pode ignorá-lo.",
    ]),
  };
}

/** Convite para um ajudante externo (alguém de fora que ajuda um participante). */
export function emailAjudante({ quemConvidou, link }: { quemConvidou?: string; link: string }): Email {
  const quem = primeiroNome(quemConvidou) ?? "Alguém da família Alves";
  return {
    assunto: `${quem} pediu sua ajuda no Amigo Oculto Alves`,
    html: moldura({
      selo: "Convite de ajudante",
      titulo: "Você foi convidado para ajudar",
      paragrafos: [
        "Oi!",
        `<strong>${escapar(quem)}</strong> chamou você para ajudar a escolher o presente do amigo oculto da família Alves.`,
        `Você vai ver quem ${escapar(quem)} tirou e a lista de presentes dessa pessoa. É só para ajudar: o segredo fica entre vocês.`,
      ],
      botao: "Ver o amigo oculto",
      link,
      observacao: OBS_LINK,
    }),
    texto: textoPuro([
      "Oi!",
      "",
      `${quem} convidou você para ajudar a escolher o presente do amigo oculto da família Alves.`,
      "Abra o link para ver quem foi sorteado e a lista de presentes:",
      link,
      "",
      "O link vale por 24 horas e só funciona uma vez.",
    ]),
  };
}

/** A pessoa que você tirou mexeu na lista. Sem nomes: o e-mail não entrega o segredo. */
export function emailListaAlterada({ nome }: { nome?: string }): Email {
  const oi = saudacao(nome);
  const link = `${SITE}/`;
  return {
    assunto: "Seu amigo oculto atualizou a lista de presentes",
    html: moldura({
      selo: "Lista atualizada",
      titulo: "Tem dica nova na lista",
      paragrafos: [
        escapar(oi),
        "A pessoa que você tirou acabou de mexer na lista de presentes. Pode ser a pista que faltava.",
      ],
      botao: "Ver a lista",
      link,
      observacao: "Para não lotar sua caixa, juntamos as mudanças: no máximo um aviso a cada 3 horas.",
    }),
    texto: textoPuro([
      oi,
      "",
      "A pessoa que você tirou atualizou a lista de presentes.",
      `Veja em ${link}`,
    ]),
  };
}

/** Mensagem nova no chat anônimo. Não traz o texto nem quem enviou. */
export function emailMensagemNova({ nome, papel }: { nome?: string; papel: "da" | "recebe" }): Email {
  const oi = saudacao(nome);
  const quem = papel === "da" ? "a pessoa que você tirou" : "quem tirou você";
  const link = `${SITE}/conversas`;
  return {
    assunto: "Você tem uma mensagem do seu amigo oculto",
    html: moldura({
      selo: "Mensagem anônima",
      titulo: "Chegou uma mensagem para você",
      paragrafos: [escapar(oi), `Seu amigo oculto (${quem}) mandou uma mensagem anônima.`],
      botao: "Ler a mensagem",
      link,
      observacao: "Para não lotar sua caixa, avisamos no máximo uma vez por hora.",
    }),
    texto: textoPuro([oi, "", `Seu amigo oculto (${quem}) mandou uma mensagem anônima.`, `Leia em ${link}`]),
  };
}

/** Lembrete da festa (7 e 2 dias antes). */
export function emailLembrete({ nome, dias, dataTexto }: { nome?: string; dias: number; dataTexto: string }): Email {
  const oi = saudacao(nome);
  const link = `${SITE}/`;
  const perto = dias <= 2;
  return {
    assunto: perto ? `Faltam ${dias} dias para o Amigo Oculto Alves` : "Falta uma semana para o Amigo Oculto Alves",
    html: moldura({
      selo: perto ? "Reta final" : "Contagem regressiva",
      titulo: perto ? "Está quase na hora" : "Uma semana para o nosso encontro",
      paragrafos: [
        escapar(oi),
        perto
          ? "Faltam só dois dias. Se o presente ainda não está embrulhado, este é o momento."
          : "Falta uma semana. Que tal dar uma última olhada na lista de quem você tirou?",
        `Nos vemos em <strong>${escapar(dataTexto)}</strong>. Leve o celular: vai ter jogo ao vivo.`,
      ],
      destaque: { numero: String(dias), legenda: dias === 1 ? "dia para a festa" : "dias para a festa" },
      botao: "Ver o meu amigo oculto",
      link,
      observacao: "Valor sugerido do presente: R$ 50 a R$ 60.",
    }),
    texto: textoPuro([
      oi,
      "",
      `Faltam ${dias} dias para o Amigo Oculto Alves (${dataTexto}).`,
      "Leve o celular: vai ter jogo ao vivo!",
      `Veja seu amigo oculto em ${link}`,
    ]),
  };
}
