-- 005: jogo ao vivo
--  * votar() recusa palpite em quem já foi revelado como amigo oculto
--  * primeiro_revelador(): nome de quem começa (posição 0 do círculo),
--    usado pela roleta do início do jogo. Nenhum nome fica no código.

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
  if v_rodada.id is null or v_rodada.status <> 'votando' then
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

create or replace function public.primeiro_revelador()
 returns text
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select p.nome
    from sorteio s join participantes p on p.id = s.quem_da_id
   where s.posicao_circulo = 0
     and meu_participante_id() is not null
$function$;

revoke execute on function public.primeiro_revelador() from public, anon;
grant execute on function public.primeiro_revelador() to authenticated;
