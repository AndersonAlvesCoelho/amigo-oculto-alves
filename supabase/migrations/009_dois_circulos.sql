-- 009: sorteio em DOIS círculos (metade + metade; 26 = 13 + 13)
--  * sorteio.circulo (1 ou 2); posição única dentro de cada círculo
--  * realizar_sorteio(): círculo 1 começa com p_primeiro -> p_segundo
--  * estado_jogo(): devolve o círculo de cada rodada, o tamanho do círculo
--    e o total de rodadas do jogo
--  * jogo_proxima_rodada(p_iniciar): segue o círculo; quando ele fecha (ou
--    no começo), o admin informa quem começa o próximo círculo
--  * proximo_circulo(): quem pode começar o próximo círculo (só admin)
-- Depois de rodar: apague o sorteio de teste e rode realizar_sorteio de novo.

-- 1. Tabela
alter table public.sorteio add column if not exists circulo smallint not null default 1;
alter table public.sorteio drop constraint if exists sorteio_circulo_check;
alter table public.sorteio add constraint sorteio_circulo_check check (circulo in (1, 2));
alter table public.sorteio drop constraint if exists sorteio_posicao_circulo_key;
alter table public.sorteio drop constraint if exists sorteio_circulo_posicao_key;
alter table public.sorteio add constraint sorteio_circulo_posicao_key unique (circulo, posicao_circulo);

-- 2. Sorteio em dois círculos
create or replace function public.realizar_sorteio(p_primeiro text, p_segundo text, p_tentativas integer default 5000)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_primeiro uuid; v_segundo uuid; v_todos uuid[]; v_c1 uuid[]; v_c2 uuid[];
  v_n int; v_t1 int; v_ok boolean; t int;
begin
  if exists (select 1 from sorteio) then
    raise exception 'O sorteio já foi realizado';
  end if;

  select id into v_primeiro from participantes where email = lower(p_primeiro);
  select id into v_segundo  from participantes where email = lower(p_segundo);
  if v_primeiro is null or v_segundo is null then
    raise exception 'Participante não encontrado';
  end if;

  select count(*) into v_n from participantes;
  if v_n < 5 then raise exception 'São precisos pelo menos 5 participantes'; end if;
  v_t1 := v_n - v_n / 2;  -- círculo 1 fica com a metade (ou um a mais, se for ímpar)

  for t in 1..p_tentativas loop
    select array_agg(id order by random()) into v_todos
      from participantes where id not in (v_primeiro, v_segundo);
    v_c1 := array[v_primeiro, v_segundo] || v_todos[1 : v_t1 - 2];
    v_c2 := v_todos[v_t1 - 1 : v_n - 2];

    -- nenhuma exclusão entre vizinhos (inclusive o último -> o primeiro)
    v_ok := not exists (
      select 1
        from (select c.arr[g] as da, c.arr[g % array_length(c.arr, 1) + 1] as recebe
                from (values (v_c1), (v_c2)) as c(arr),
                     generate_series(1, array_length(c.arr, 1)) g) par
        join exclusoes e
          on (e.participante_a = par.da and e.participante_b = par.recebe)
          or (e.participante_b = par.da and e.participante_a = par.recebe));

    if v_ok then
      insert into sorteio (quem_da_id, quem_recebe_id, posicao_circulo, circulo)
      select v_c1[g], v_c1[g % array_length(v_c1, 1) + 1], g - 1, 1
        from generate_series(1, array_length(v_c1, 1)) g;
      insert into sorteio (quem_da_id, quem_recebe_id, posicao_circulo, circulo)
      select v_c2[g], v_c2[g % array_length(v_c2, 1) + 1], g - 1, 2
        from generate_series(1, array_length(v_c2, 1)) g;
      return format('Sorteio realizado: dois círculos (%s + %s).',
                    array_length(v_c1, 1), array_length(v_c2, 1));
    end if;
  end loop;

  raise exception 'Não foi possível montar os círculos respeitando as exclusões';
end $function$;

revoke execute on function public.realizar_sorteio(text, text, integer) from public, anon, authenticated;

-- 3. Estado do jogo com o círculo
drop function if exists public.estado_jogo();
create function public.estado_jogo()
 returns table(
   rodada_id uuid, ordem integer, status status_rodada,
   revelador_id uuid, revelador_nome text,
   amigo_id uuid, amigo_nome text, total_votos bigint,
   fim_votacao timestamptz, agora timestamptz,
   circulo smallint, tamanho_circulo bigint, total_rodadas bigint
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select r.id, r.ordem,
         case when r.status = 'votando' and now() >= r.iniciada_em + prazo_votacao()
              then 'encerrada'::status_rodada else r.status end,
         s.quem_da_id, pd.nome,
         case when r.status = 'revelada' then s.quem_recebe_id end,
         case when r.status = 'revelada' then pr.nome end,
         (select count(*) from palpites pa where pa.rodada_id = r.id),
         r.iniciada_em + prazo_votacao(),
         now(),
         s.circulo,
         (select count(*) from sorteio s2 where s2.circulo = s.circulo),
         (select count(*) from sorteio)
    from rodadas r
    join sorteio s        on s.id  = r.sorteio_id
    join participantes pd on pd.id = s.quem_da_id
    join participantes pr on pr.id = s.quem_recebe_id
   where meu_participante_id() is not null
   order by r.ordem
$function$;
revoke execute on function public.estado_jogo() from public, anon;
grant execute on function public.estado_jogo() to authenticated;

-- 4. Próxima rodada: segue o círculo; para começar um círculo, informe quem começa
drop function if exists public.jogo_proxima_rodada();
create function public.jogo_proxima_rodada(p_iniciar uuid default null)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_ultima rodadas; v_quem_recebe uuid; v_prox uuid;
begin
  if not sou_admin() then raise exception 'Apenas admin'; end if;

  select * into v_ultima from rodadas order by ordem desc limit 1;
  if v_ultima.id is not null and v_ultima.status <> 'revelada' then
    raise exception 'Revele a rodada atual antes de abrir a próxima';
  end if;
  if not exists (select 1 from sorteio s
                  where not exists (select 1 from rodadas r where r.sorteio_id = s.id)) then
    raise exception 'Todas as rodadas já foram jogadas';
  end if;

  -- quem acabou de ser revelado é quem revela agora (se ainda não revelou)
  if v_ultima.id is not null then
    select quem_recebe_id into v_quem_recebe from sorteio where id = v_ultima.sorteio_id;
    select s.id into v_prox from sorteio s
     where s.quem_da_id = v_quem_recebe
       and not exists (select 1 from rodadas r where r.sorteio_id = s.id);
  end if;

  -- círculo fechado (ou início do jogo): começa um círculo ainda não jogado
  if v_prox is null then
    if p_iniciar is null then
      raise exception 'Escolha quem começa o próximo círculo';
    end if;
    select s.id into v_prox from sorteio s
     where s.quem_da_id = p_iniciar
       and not exists (select 1 from rodadas r join sorteio s2 on s2.id = r.sorteio_id
                        where s2.circulo = s.circulo);
    if v_prox is null then
      raise exception 'Essa pessoa não pode começar um círculo agora';
    end if;
  end if;

  insert into rodadas (sorteio_id, ordem)
  values (v_prox, coalesce(v_ultima.ordem + 1, 0));
end $function$;
revoke execute on function public.jogo_proxima_rodada(uuid) from public, anon;
grant execute on function public.jogo_proxima_rodada(uuid) to authenticated;

-- 5. Quem pode começar o próximo círculo (só admin). "posicao" 0 = quem abre o círculo no sorteio.
create or replace function public.proximo_circulo()
 returns table(circulo smallint, participante_id uuid, nome text, posicao integer)
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select s.circulo, s.quem_da_id, p.nome, s.posicao_circulo
    from sorteio s
    join participantes p on p.id = s.quem_da_id
   where sou_admin()
     and s.circulo = (
       select min(s2.circulo) from sorteio s2
        where not exists (select 1 from rodadas r join sorteio s3 on s3.id = r.sorteio_id
                           where s3.circulo = s2.circulo))
   order by p.nome
$function$;
revoke execute on function public.proximo_circulo() from public, anon;
grant execute on function public.proximo_circulo() to authenticated;

-- 6. A roleta agora usa proximo_circulo()
drop function if exists public.primeiro_revelador();
