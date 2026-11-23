import "server-only";

/** Bloqueia endereços internos (evita usar o servidor para sondar a rede). */
function enderecoPermitido(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false; // IPs
  return host.includes(".");
}

function absoluta(valor: string, base: URL) {
  try {
    const u = new URL(valor.replace(/&amp;/g, "&"), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function lerMeta(html: string, chaves: string[]) {
  for (const chave of chaves) {
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name)=["']${chave}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${chave}["']`,
      "i",
    );
    const m = html.match(re1) ?? html.match(re2);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Tenta descobrir a foto do produto (og:image) a partir do link da loja.
 * Devolve null se o site bloquear, demorar ou não tiver foto.
 */
export async function buscarFotoDoLink(link: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (!enderecoPermitido(url)) return null;

  try {
    const resposta = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AmigoOcultoAlves/1.0; +https://amigoocultoalves.com.br)",
        Accept: "text/html",
      },
    });
    if (!resposta.ok || !resposta.body) return null;
    if (!(resposta.headers.get("content-type") ?? "").includes("html")) return null;

    // lê no máximo ~600 KB: as metatags ficam no começo da página
    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    let html = "";
    while (html.length < 600_000) {
      const { done, value } = await leitor.read();
      if (done) break;
      html += decodificador.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    leitor.cancel().catch(() => {});

    const imagem = lerMeta(html, ["og:image:secure_url", "og:image", "twitter:image"]);
    return imagem ? absoluta(imagem, new URL(resposta.url)) : null;
  } catch {
    return null;
  }
}
