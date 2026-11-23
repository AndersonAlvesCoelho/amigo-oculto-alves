import { PaginaPublica } from "@/app/entrar/pagina-publica";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift } from "lucide-react";
import { confirmarLink } from "./actions";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; code?: string }>;
}) {
  const { token_hash, type, code } = await searchParams;
  // Primeiro acesso (convite do sorteio) ou reenvio da ativação
  const ativacao = type === "invite" || type === "signup";

  return (
    <PaginaPublica
      icone={<Gift size={46} className="mb-7 text-primary" aria-hidden />}
      titulo={ativacao ? "Seu amigo oculto está esperando." : "Quase lá"}
      texto={
        ativacao
          ? "Toque no botão para ativar sua conta e descobrir quem você tirou."
          : "Toque no botão para entrar no Amigo Oculto Alves."
      }
    >
      {/* O botão evita que robôs de verificação de e-mail gastem o link */}
      <form action={confirmarLink}>
        <input type="hidden" name="token_hash" value={token_hash ?? ""} />
        <input type="hidden" name="code" value={code ?? ""} />
        <input type="hidden" name="type" value={type ?? ""} />
        <Button type="submit" className="w-full">
          Entrar
          <ArrowRight aria-hidden />
        </Button>
      </form>
    </PaginaPublica>
  );
}
