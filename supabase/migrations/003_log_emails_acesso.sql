-- 003: permite registrar o e-mail de link de acesso ("acesso") em log_emails
-- e acelera a consulta do limite de 1 e-mail por minuto.

alter table public.log_emails drop constraint log_emails_tipo_check;

alter table public.log_emails add constraint log_emails_tipo_check
  check (tipo = any (array[
    'convite', 'acesso', 'resultado', 'lembrete',
    'lista_alterada', 'mensagem_nova', 'ajudante'
  ]));

create index if not exists log_emails_destino_enviado_idx
  on public.log_emails (email_destino, enviado_em desc);
