-- 004: permissões de tabela para os papéis da API.
-- O RLS só filtra linhas; sem GRANT o papel nem chega a ler a tabela.
-- Hoje anon e authenticated só têm REFERENCES/TRIGGER/TRUNCATE (nada útil e
-- TRUNCATE não deveria estar lá). Este script zera e concede só o necessário.

-- 1. Zera tudo para anon e authenticated (o service_role continua com tudo)
revoke all on all tables in schema public from anon, authenticated;

-- 2. participantes: só id, nome e is_admin (e-mails ficam escondidos)
grant select (id, nome, is_admin) on public.participantes to authenticated;

-- 3. Listas de presentes: todos leem, cada um mexe na própria (RLS)
grant select, insert, update, delete on public.itens_desejo to authenticated;

-- 4. Sorteio: cada um vê só a própria linha (RLS)
grant select on public.sorteio to authenticated;

-- 5. Ajudantes: ver, convidar e remover os próprios (RLS)
grant select, insert, delete on public.ajudantes to authenticated;

-- 6. Chat: ler, enviar e marcar como lida (RLS)
grant select, insert on public.mensagens to authenticated;
grant update (lida) on public.mensagens to authenticated;

-- 7. Jogo: leitura (as ações passam pelas funções security definer)
grant select on public.rodadas to authenticated;
grant select on public.palpites to authenticated;

-- exclusoes e log_emails: nenhuma permissão (só o servidor, com a secret key)

-- 8. Tabelas futuras não herdam nada para anon/authenticated
alter default privileges in schema public revoke all on tables from anon, authenticated;
