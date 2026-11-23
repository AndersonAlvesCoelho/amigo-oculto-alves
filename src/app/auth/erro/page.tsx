import { FormEntrar } from "@/app/entrar/form-entrar";
import { PaginaPublica } from "@/app/entrar/pagina-publica";

export default function ErroPage() {
  return (
    <PaginaPublica
      titulo="Seu link venceu ou já foi usado"
      texto="Os links valem por 24 horas e só funcionam uma vez. Digite seu e-mail para receber outro. O segredo continua esperando por você."
    >
      <FormEntrar />
    </PaginaPublica>
  );
}
