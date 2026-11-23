-- =====================================================================
-- VIRADA PARA O REAL — NÃO RODE ANTES DE TERMINAR OS TESTES!
-- Apaga TODOS os dados de teste, cria os 26 participantes reais,
-- as exclusões, roda o sorteio e sorteia o amigo de fachada.
-- Roda tudo numa transação: se algo falhar, nada é gravado.
-- Pré-requisito: migrations 001 a 007 rodadas.
-- =====================================================================
begin;

-- 1. Limpa os dados de teste (jogo, chat, listas, sorteio, participantes)
truncate table palpites, rodadas, mensagens, itens_desejo, ajudantes,
               sorteio, exclusoes, log_emails, participantes cascade;

-- 2. Os 26 participantes reais (Anderson e Shirley começam como admins)
insert into participantes (nome, email, is_admin) values
  ('Adam',        'adambarra@gmail.com',                  false),
  ('Ana Beatriz', 'anabeatrizsf7@gmail.com',              false),
  ('Anderson',    'a0a0coelho0@gmail.com',                true),
  ('André',       'andre1226fsa@gmail.com',               false),
  ('Annelise',    'annelise.3ac@gmail.com',               false),
  ('Augusto',     'a.c.a.a.c@hotmail.com',                false),
  ('Cecília',     'lemes.annelise@gmail.com',             false),
  ('Claudia',     'claudiamfm10@gmail.com',               false),
  ('Enzzo',       'shaf_00@hotmail.com',                  false),
  ('Isabela',     'alemesisabela@gmail.com',              false),
  ('Janeider',    'janeider01@yahoo.co.uk',               false),
  ('Jéssica',     'jessica.azb26@gmail.com',              false),
  ('John',        'johnmadders@hotmail.co.uk',            false),
  ('Larissa',     'larissazamithb@gmail.com',             false),
  ('Leonor',      'alves.c4@gmail.com',                   false),
  ('Letícia',     'narayanamartins@gmail.com',            false),
  ('Lourenço',    'acfarmacia@gmail.com',                 false),
  ('Luís',        'luisaugusto.r.a.c@gmail.com',          false),
  ('Marcélia',    'marceliaaferreira@gmail.com',          false),
  ('Narayana',    'narayanaro@hotmail.com',               false),
  ('Renata',      'barrosorenata16@gmail.com',            false),
  ('Scheneider',  'scheneider.af@gmail.com',              false),
  ('Sérgio',      'vscoelho2003@yahoo.com.br',            false),
  ('Shirley',     'shirleyaf@gmail.com',                  true),
  ('Suzana',      'suzanaferreiradossantos637@gmail.com', false),
  ('Ubelina',     'ubelina.af@gmail.com',                 false);

-- 3. Apaga as contas de login de teste (mantém as de quem está na lista real)
delete from auth.users
 where lower(email) not in (select email from participantes);

-- 4. Religa as contas que já existem (ex.: a sua) aos novos participantes
update participantes p
   set auth_user_id = u.id
  from auth.users u
 where lower(u.email) = p.email;

-- 5. Exclusões (quem não pode tirar quem)
insert into exclusoes (participante_a, participante_b, motivo)
select a.id, b.id, x.motivo
  from (values
    ('annelise.3ac@gmail.com',  'lemes.annelise@gmail.com',    'mãe e filha'),
    ('annelise.3ac@gmail.com',  'alemesisabela@gmail.com',     'mãe e filha'),
    ('narayanaro@hotmail.com',  'acfarmacia@gmail.com',        'mãe e filho'),
    ('narayanaro@hotmail.com',  'narayanamartins@gmail.com',   'mãe e filha'),
    ('narayanaro@hotmail.com',  'luisaugusto.r.a.c@gmail.com', 'mãe e filho'),
    ('a.c.a.a.c@hotmail.com',   'acfarmacia@gmail.com',        'pai e filho'),
    ('a.c.a.a.c@hotmail.com',   'narayanamartins@gmail.com',   'pai e filha'),
    ('a.c.a.a.c@hotmail.com',   'luisaugusto.r.a.c@gmail.com', 'pai e filho'),
    ('anabeatrizsf7@gmail.com', 'barrosorenata16@gmail.com',   'Ana Beatriz não tira Renata')
  ) as x(email_a, email_b, motivo)
  join participantes a on a.email = x.email_a
  join participantes b on b.email = x.email_b;

-- 6. Sorteio: Anderson abre o círculo e tira a Ana Beatriz
select realizar_sorteio('a0a0coelho0@gmail.com', 'anabeatrizsf7@gmail.com');

-- 7. Amigo de fachada do Anderson: qualquer um, menos ele, a Ana Beatriz e a Renata
update participantes
   set amigo_fachada_id = (
     select id from participantes
      where email not in ('a0a0coelho0@gmail.com', 'anabeatrizsf7@gmail.com', 'barrosorenata16@gmail.com')
      order by random() limit 1)
 where email = 'a0a0coelho0@gmail.com';

-- 8. Conferências (devem dar 26, 9 e 26)
select
  (select count(*) from participantes) as participantes,
  (select count(*) from exclusoes)     as exclusoes,
  (select count(*) from sorteio)       as linhas_do_sorteio;

commit;

-- =====================================================================
-- DEPOIS DE ENVIAR OS CONVITES (rode separado, quando quiser esconder o admin):
--   update participantes set is_admin = false where email = 'a0a0coelho0@gmail.com';
--
-- PLANO B no dia da festa, se o cron não devolver o admin:
--   update participantes set is_admin = true  where email = 'a0a0coelho0@gmail.com';
-- =====================================================================
