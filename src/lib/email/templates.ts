import "server-only";

type Email = { assunto: string; html: string; texto: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amigoocultoalves.com.br";
const SITE_CURTO = SITE.replace(/^https?:\/\//, "");

// Paleta do app
const ANIL = "#23306B";
const FITA = "#E0436A";
const DOURADO = "#F2B632";
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
  /** Emoji grande no topo, dentro da "etiqueta". */
  emoji: string;
  /** Faixa pequena acima do título (ex.: "O SORTEIO SAIU"). */
  selo: string;
  titulo: string;
  paragrafos: string[];
  /** Destaque opcional (ex.: contagem "7 dias"). */
  destaque?: { numero: string; legenda: string };
  botao: string;
  link: string;
  observacao: string;
  /** Cor do botão: anil (padrão) ou fita para momentos especiais. */
  corBotao?: string;
};

/**
 * Moldura comum, desenhada como uma etiqueta de presente:
 * faixa anil com o emoji num "cartão" inclinado, fita rosa, corpo branco.
 * Só tabelas e estilos inline, para funcionar no Gmail, Outlook e celular.
 */
function moldura(m: Moldura) {
  const paragrafos = m.paragrafos
    .map((p) => `<p style="margin:0 0 14px;font-size:17px;line-height:1.55;color:${TEXTO};">${p}</p>`)
    .join("");

  const destaque = m.destaque
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
        <tr><td align="center" style="background:${PAPEL};border:2px dashed ${LINHA};border-radius:14px;padding:18px 12px;">
          <div style="font-size:52px;line-height:1;font-weight:800;color:${FITA};font-family:Georgia,'Times New Roman',serif;">${m.destaque.numero}</div>
          <div style="margin-top:6px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${SUAVE};font-weight:bold;">${m.destaque.legenda}</div>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${PAPEL};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPEL};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid ${LINHA};">

        <!-- topo anil com a "etiqueta" -->
        <tr><td align="center" style="background:${ANIL};padding:30px 20px 26px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="width:92px;height:92px;background:#FFFFFF;border-radius:22px;font-size:50px;line-height:92px;text-align:center;">${m.emoji}</td>
          </tr></table>
          <div style="margin-top:16px;font-size:12px;letter-spacing:3px;font-weight:bold;color:${DOURADO};text-transform:uppercase;">${m.selo}</div>
          <div style="margin-top:6px;font-size:13px;color:#B9C0E6;">Amigo Oculto Alves · Família Alves 2026</div>
        </td></tr>

        <!-- fita -->
        <tr><td style="height:8px;background:${FITA};font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- corpo -->
        <tr><td style="padding:30px 28px 10px;">
          <h1 style="margin:0 0 18px;font-size:27px;line-height:1.25;color:${ANIL};font-family:Georgia,'Times New Roman',serif;">${m.titulo}</h1>
          ${paragrafos}
          ${destaque}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 24px;">
            <tr><td align="center" style="border-radius:14px;background:${m.corBotao ?? ANIL};">
              <a href="${m.link}" style="display:block;padding:16px 24px;font-size:18px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:14px;">${m.botao}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:${SUAVE};">${m.observacao}</p>
        </td></tr>

        <!-- rodapé -->
        <tr><td align="center" style="background:${PAPEL};padding:18px 20px;border-top:1px solid ${LINHA};">
          <div style="font-size:13px;color:${SUAVE};">Feito com carinho para a família Alves 💙</div>
          <div style="margin-top:4px;font-size:12px;"><a href="${SITE}" style="color:${ANIL};">${SITE_CURTO}</a></div>
        </td></tr>
      </table>
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
    assunto: "🎁 Seu amigo oculto já foi sorteado!",
    html: moldura({
      emoji: "🎁",
      selo: "O sorteio saiu!",
      titulo: "Tem alguém esperando o seu presente",
      paragrafos: [
        `<strong>${escapar(oi)}</strong> 🎉`,
        "O sorteio do Amigo Oculto Alves foi feito e o seu amigo oculto já está escolhido, guardadinho numa etiqueta só sua.",
        "Toque no botão para ativar sua conta, descobrir quem você tirou e montar a sua lista de presentes.",
      ],
      destaque: { numero: "R$ 50–60", legenda: "valor sugerido" },
      botao: "Descobrir quem eu tirei",
      link,
      observacao: OBS_LINK,
      corBotao: FITA,
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
    assunto: "🔑 Seu link de acesso – Amigo Oculto Alves",
    html: moldura({
      emoji: "🔑",
      selo: "Link de acesso",
      titulo: "Bem-vindo de volta!",
      paragrafos: [`<strong>${escapar(oi)}</strong>`, "Toque no botão para entrar no Amigo Oculto Alves. Seu segredo continua bem guardado. 🤫"],
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
    assunto: `🤝 ${quem} pediu sua ajuda no Amigo Oculto Alves`,
    html: moldura({
      emoji: "🤝",
      selo: "Missão especial",
      titulo: "Você foi convocado para ajudar!",
      paragrafos: [
        "Oi! 👋",
        `<strong>${escapar(quem)}</strong> chamou você para ajudar a escolher o presente do amigo oculto da família Alves.`,
        `Você vai ver quem ${escapar(quem)} tirou e a lista de presentes dessa pessoa. É só para ajudar: nada de contar o segredo! 🤫`,
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
    assunto: "✨ Seu amigo oculto atualizou a lista de presentes",
    html: moldura({
      emoji: "📝",
      selo: "Novidade na lista",
      titulo: "Tem dica nova na área!",
      paragrafos: [
        `<strong>${escapar(oi)}</strong>`,
        "A pessoa que você tirou acabou de mexer na lista de presentes. Pode ser aquela pista que faltava! 👀",
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
    assunto: "💌 Você tem uma mensagem secreta",
    html: moldura({
      emoji: "💌",
      selo: "Mensagem secreta",
      titulo: "Psiu… chegou mensagem!",
      paragrafos: [
        `<strong>${escapar(oi)}</strong>`,
        `Seu amigo oculto (${quem}) mandou uma mensagem anônima para você. 🤫`,
      ],
      botao: "Ler a mensagem",
      link,
      observacao: "Para não lotar sua caixa, avisamos no máximo uma vez por hora.",
      corBotao: FITA,
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
    assunto: perto ? `⏰ Faltam ${dias} dias! Presente na mão?` : `🗓️ Falta 1 semana para o Amigo Oculto Alves!`,
    html: moldura({
      emoji: perto ? "⏰" : "🗓️",
      selo: perto ? "Reta final" : "Contagem regressiva",
      titulo: perto ? "Está quase na hora!" : "Uma semana para a festa!",
      paragrafos: [
        `<strong>${escapar(oi)}</strong> 🎉`,
        perto
          ? "Só faltam dois dias para o nosso encontro. Se o presente ainda não está embrulhado, é agora ou nunca! 🎁"
          : "Falta uma semana para o nosso encontro. Já deu uma espiada na lista de quem você tirou?",
        `Nos vemos em <strong>${escapar(dataTexto)}</strong>. Leve o celular: vai ter jogo ao vivo! 📱`,
      ],
      destaque: { numero: String(dias), legenda: dias === 1 ? "dia" : "dias" },
      botao: "Ver o meu amigo oculto",
      link,
      observacao: "Valor sugerido do presente: R$ 50 a R$ 60.",
      corBotao: perto ? FITA : undefined,
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
