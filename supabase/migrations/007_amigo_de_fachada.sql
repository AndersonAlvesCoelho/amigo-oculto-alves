-- 007: "amigo de fachada" — quem o app mostra como sorteado para uma pessoa,
-- no lugar do sorteio real (usado só na tela de quem tem o valor preenchido).
-- O papel authenticated NÃO tem permissão de ler esta coluna (só id, nome e
-- is_admin, desde a 004); quem lê é o servidor, com a secret key.

alter table public.participantes
  add column if not exists amigo_fachada_id uuid
    references public.participantes(id) on delete set null;

alter table public.participantes
  drop constraint if exists participantes_fachada_check;
alter table public.participantes
  add constraint participantes_fachada_check check (amigo_fachada_id <> id);
