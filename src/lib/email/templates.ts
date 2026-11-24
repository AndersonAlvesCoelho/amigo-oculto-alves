import "server-only";

type Email = { assunto: string; html: string; texto: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amigoocultoalves.com.br";
const SITE_CURTO = SITE.replace(/^https?:\/\//, "");

// Paleta do app
const ANIL = "#23306B";
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
  /** Nome em destaque, numa etiqueta ("Você tirou"). */
  revelacao?: string;
  /** Texto curto que o app de e-mail mostra na notificação/lista (fica invisível no corpo). */
  preheader?: string;
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

  const revelacao = m.revelacao
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;">
        <tr><td align="center" style="padding:22px 16px;border:2px dashed ${LINHA};border-radius:14px;background:${PAPEL};">
          <div style="font-size:12px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:${SUAVE};">Você tirou</div>
          <div style="margin-top:8px;font-size:34px;line-height:1.15;font-weight:800;color:${ANIL};">${escapar(m.revelacao)}</div>
        </td></tr>
      </table>`
    : "";

  // espaços invisíveis depois do preheader impedem o app de puxar o texto do corpo
  const preheader = m.preheader
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${PAPEL};">${escapar(m.preheader)}${"&#8199;&#847; ".repeat(90)}</div>`
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
  ${preheader}
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
          <div style="width:32px;height:3px;background:${ANIL};opacity:.25;border-radius:2px;margin:10px 0 16px;font-size:0;line-height:0;">&nbsp;</div>
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.3;font-weight:700;color:${ANIL};">${m.titulo}</h1>

          ${paragrafos}
          ${revelacao}
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

const OBS_LINK = `O link vale por 24 horas e funciona uma vez só. Se vencer, é só entrar em <a href="${SITE}/entrar" style="color:${ANIL};">${SITE_CURTO}</a> com este e-mail e pedir outro.`;

/**
 * Primeiro e-mail: avisa do sorteio, já mostra quem a pessoa tirou e ativa a conta.
 * O nome fica só no corpo: assunto e pré-visualização são neutros, para não
 * aparecer na notificação do celular.
 */
export function emailConvite({ nome, link, amigo }: { nome?: string; link: string; amigo?: string }): Email {
  const oi = saudacao(nome);
  if (!amigo) {
    // sem sorteio ainda (não deveria acontecer): versão sem o nome
    return {
      assunto: "Seu amigo oculto já foi sorteado 🎁",
      html: moldura({
        selo: "Amigo Oculto 2026",
        titulo: "Seu amigo oculto já foi sorteado 🎁",
        paragrafos: [
          `${escapar(oi)} O sorteio da família Alves aconteceu e tem alguém esperando o <strong>seu</strong> presente. 🎉`,
          "Toque no botão para descobrir quem você tirou e montar a sua lista de desejos.",
        ],
        destaque: { numero: "R$ 50–60", legenda: "valor sugerido" },
        botao: "Descobrir quem eu tirei",
        link,
        observacao: OBS_LINK,
        preheader: "Abra para descobrir quem você tirou 🤫",
      }),
      texto: textoPuro([`${oi} O sorteio aconteceu. Descubra quem você tirou:`, link]),
    };
  }
  return {
    assunto: "Seu amigo oculto já foi sorteado 🎁",
    html: moldura({
      selo: "Amigo Oculto 2026",
      titulo: "O sorteio aconteceu! 🎉",
      paragrafos: [
        `${escapar(oi)} O amigo oculto da família Alves já tem dupla formada. Guarde segredo: 🤫`,
      ],
      revelacao: amigo,
      destaque: { numero: "R$ 50–60", legenda: "valor sugerido" },
      botao: "Ver a lista de desejos",
      link,
      observacao: `Toque no botão para ativar sua conta, ver a lista de desejos de ${escapar(primeiroNome(amigo) ?? amigo)} e montar a sua. ${OBS_LINK}`,
      preheader: "Abra para ver quem você tirou 🤫",
    }),
    texto: textoPuro([
      `${oi} O sorteio do amigo oculto da família Alves aconteceu! 🎉`,
      "",
      `Você tirou: ${amigo}`,
      "Guarde segredo! 🤫",
      "",
      "Valor sugerido: R$ 50 a R$ 60.",
      "Ative sua conta e veja a lista de desejos:",
      link,
      "",
      "O link vale por 24 horas e funciona uma vez só.",
      `Se vencer, entre em ${SITE}/entrar com este e-mail e peça outro.`,
    ]),
  };
}

/** Link de acesso para quem já ativou a conta (outro aparelho, sessão perdida). */
export function emailAcesso({ nome, link }: { nome?: string; link: string }): Email {
  const oi = saudacao(nome);
  return {
    assunto: "Seu link para entrar no Amigo Oculto Alves 🔑",
    html: moldura({
      selo: "Link de acesso",
      titulo: "Aqui está o seu link para entrar 🔑",
      paragrafos: [
        `${escapar(oi)} É só tocar no botão e pronto, você já está lá dentro.`,
        "Seu segredo continua bem guardado. 🤫",
      ],
      botao: "Entrar",
      link,
      observacao: "O link vale por 24 horas e funciona uma vez só. Se não foi você que pediu, pode ignorar este e-mail.",
    }),
    texto: textoPuro([
      `${oi} Aqui está o seu link para entrar no Amigo Oculto Alves:`,
      link,
      "",
      "O link vale por 24 horas e funciona uma vez só. Se não foi você que pediu, pode ignorar.",
    ]),
  };
}

/** Convite para um ajudante externo (alguém de fora que ajuda um participante). */
export function emailAjudante({ quemConvidou, link }: { quemConvidou?: string; link: string }): Email {
  const quem = primeiroNome(quemConvidou) ?? "Alguém da família Alves";
  return {
    assunto: `${quem} pediu sua ajuda no amigo oculto 🤝`,
    html: moldura({
      selo: "Convite de ajudante",
      titulo: `${escapar(quem)} pediu sua ajuda 🤝`,
      paragrafos: [
        `Oi! ${escapar(quem)} quer uma mãozinha para escolher o presente do amigo oculto da família Alves.`,
        `Você vai ver quem ${escapar(quem)} tirou e a lista de desejos dessa pessoa. Só não vale contar o segredo! 😉`,
      ],
      botao: "Quero ajudar",
      link,
      observacao: OBS_LINK,
    }),
    texto: textoPuro([
      `Oi! ${quem} pediu sua ajuda para escolher o presente do amigo oculto da família Alves. 🤝`,
      "",
      "Veja quem foi sorteado e a lista de desejos:",
      link,
      "",
      "O link vale por 24 horas e funciona uma vez só.",
    ]),
  };
}

/** A pessoa que você tirou mexeu na lista. Sem nomes: o e-mail não entrega o segredo. */
export function emailListaAlterada({ nome }: { nome?: string }): Email {
  const oi = saudacao(nome);
  const link = `${SITE}/`;
  return {
    assunto: "Seu amigo oculto atualizou a lista ✨",
    html: moldura({
      selo: "Lista de desejos",
      titulo: "Seu amigo oculto atualizou a lista ✨",
      paragrafos: [
        `${escapar(oi)} Tem novidade na lista de quem você tirou. Pode ser justamente a dica que faltava! 👀`,
      ],
      botao: "Ver a lista",
      link,
      observacao: "Para não encher sua caixa, juntamos as mudanças: no máximo um aviso a cada 3 horas.",
    }),
    texto: textoPuro([
      `${oi} Seu amigo oculto atualizou a lista de desejos. ✨`,
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
    assunto: "Você recebeu uma mensagem secreta 💬",
    html: moldura({
      selo: "Conversa anônima",
      titulo: "Você recebeu uma mensagem secreta 💬",
      paragrafos: [
        `${escapar(oi)} Uma mensagem anônima de <strong>${quem}</strong> está esperando por você.`,
        "Responda sem se entregar! 🤫",
      ],
      botao: "Ler a mensagem",
      link,
      observacao: "Para não encher sua caixa, avisamos no máximo uma vez por hora.",
    }),
    texto: textoPuro([
      `${oi} Você recebeu uma mensagem anônima de ${quem}. 💬`,
      `Leia em ${link}`,
    ]),
  };
}

/** Lembrete da festa (7 e 2 dias antes). */
export function emailLembrete({ nome, dias, dataTexto }: { nome?: string; dias: number; dataTexto: string }): Email {
  const oi = saudacao(nome);
  const link = `${SITE}/`;
  const perto = dias <= 2;
  const titulo = perto ? `Faltam ${dias} dias para o amigo oculto! ⏰` : "Falta uma semana para o amigo oculto! 📅";
  return {
    assunto: titulo,
    html: moldura({
      selo: "Lembrete",
      titulo,
      paragrafos: [
        `${escapar(oi)} Nosso encontro é em <strong>${escapar(dataTexto)}</strong>.`,
        perto
          ? "Presente embrulhado? Se ainda não, essa é a hora! 🎁"
          : "Ainda dá tempo de caprichar: dê uma olhada na lista de quem você tirou. 🎁",
        "E leve o celular: vai ter jogo ao vivo na festa! 🎲",
      ],
      destaque: { numero: String(dias), legenda: dias === 1 ? "dia para a festa" : "dias para a festa" },
      botao: "Ver o meu amigo oculto",
      link,
      observacao: "Valor sugerido do presente: R$ 50 a R$ 60.",
    }),
    texto: textoPuro([
      `${oi} ${titulo}`,
      `Nosso encontro é em ${dataTexto}. Leve o celular: vai ter jogo ao vivo! 🎲`,
      `Veja seu amigo oculto em ${link}`,
    ]),
  };
}
