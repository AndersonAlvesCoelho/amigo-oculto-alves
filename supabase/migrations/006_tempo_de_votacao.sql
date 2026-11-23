-- 006: cada rodada tem 3 minutos de votação.
--  * Ao fim do prazo a votação fecha sozinha (sem precisar de "Encerrar").
--  * estado_jogo() devolve o status já considerando o prazo, o horário de
--    fim da votação e a hora do servidor (para o relógio das telas).
--  * votar() recusa palpite fora do prazo; jogo_revelar() aceita revelar
--    quando o prazo acabou.

create or replace function public.prazo_votacao()
 returns interval
 language sql
 immutable
as $$ select interval '3 minutes' $$;

drop function if exists public.estado_jogo();

create function public.estado_jogo()
 returns table(
   rodada_id uuid, ordem integer, status status_rodada,
   revelador_id uuid, revelador_nome text,
   amigo_id uuid, amigo_nome text, total_votos bigint,
   fim_votacao timestamptz, agora timestamptz
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
         now()
    from rodadas r
    join sorteio s        on s.id  = r.sorteio_id
    join participantes pd on pd.id = s.quem_da_id
    join participantes pr on pr.id = s.quem_recebe_id
   where meu_participante_id() is not null
   order by r.ordem
$function$;

revoke execute on function public.estado_jogo() from public, anon;
grant execute on function public.estado_jogo() to authenticated;

create or replace function public.votar(p_chute uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_eu uuid := meu_participante_id(); v_rodada rodadas; v_revelador uuid;
begin
  if v_eu is null then raise exception 'Somente participantes votam'; end if;
  select * into v_rodada from rodadas order by ordem desc limit 1;
  if v_rodada.id is null or v_rodada.status <> 'votando'
     or now() >= v_rodada.iniciada_em + prazo_votacao() then
    raise exception 'A votação está fechada';
  end if;
  select quem_da_id into v_revelador from sorteio where id = v_rodada.sorteio_id;
  if v_eu = v_revelador then raise exception 'Você não vota na sua própria rodada'; end if;
  if p_chute = v_revelador then raise exception 'Ninguém tira a si mesmo'; end if;
  if exists (
    select 1 from rodadas r join sorteio s on s.id = r.sorteio_id
     where r.status = 'revelada' and s.quem_recebe_id = p_chute
  ) then
    raise exception 'Essa pessoa já foi tirada em outra rodada';
  end if;

  insert into palpites (rodada_id, votante_id, chute_id)
  values (v_rodada.id, v_eu, p_chute)
  on conflict (rodada_id, votante_id)
  do update set chute_id = excluded.chute_id, criado_em = now();
end $function$;

create or replace function public.jogo_revelar()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_rodada rodadas; v_amigo uuid;
begin
  if not sou_admin() then raise exception 'Apenas admin'; end if;
  select * into v_rodada from rodadas order by ordem desc limit 1;
  if v_rodada.id is null or v_rodada.status = 'revelada' then
    raise exception 'Não há rodada para revelar';
  end if;
  if v_rodada.status = 'votando' and now() < v_rodada.iniciada_em + prazo_votacao() then
    raise exception 'A votação ainda está aberta';
  end if;
  select quem_recebe_id into v_amigo from sorteio where id = v_rodada.sorteio_id;
  update palpites set acertou = (chute_id = v_amigo) where rodada_id = v_rodada.id;
  update rodadas set status = 'revelada' where id = v_rodada.id;
end $function$;
