import { getSessao } from "@/lib/sessao";
import { redirect } from "next/navigation";
import { FormEntrar } from "./form-entrar";
import { PaginaPublica } from "./pagina-publica";

export default async function EntrarPage() {
  const sessao = await getSessao();
  if (sessao?.participante) redirect("/");
  if (sessao?.ajudando) redirect("/ajudando");

  return (
    <PaginaPublica
      titulo="Amigo Oculto Alves"
      texto="Digite seu e-mail e enviamos um link para você entrar. Sem senha."
    >
      <FormEntrar />
    </PaginaPublica>
  );
}
