-- =====================================================================
-- TESTE AUTOMATIZADO DO SORTEIO (não envia e-mail, não grava nada)
--
-- Monta os 26 participantes reais e as exclusões, roda realizar_sorteio()
-- N vezes e confere, em cada rodada:
--   1. 26 linhas no sorteio
--   2. posição 0: Anderson tira Ana Beatriz
--   3. círculo único (quem recebe na posição i é quem dá na posição i+1,
--      e o último tira o Anderson)
--   4. nenhuma exclusão violada (inclusive Ana Beatriz × Renata)
-- No fim, desfaz TUDO (os dados de teste voltam como estavam) e mostra
-- o relatório, com a distribuição de quem a Ana Beatriz tirou.
--
-- Como usar: cole este arquivo inteiro no SQL Editor e rode.
-- Para mudar a quantidade de rodadas, troque o 1000 na última linha.
-- =====================================================================

create or replace function public.teste_sorteio(p_rodadas int default 1000)
 returns table(item text, resultado text)
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_ok int := 0; v_erro_execucao int := 0; v_erro_tamanho int := 0;
  v_erro_primeiro int := 0; v_erro_circulo int := 0; v_erro_exclusao int := 0;
  v_ana_tirou jsonb := '{}'::jsonb; v_nome text; v_tmp int; r int;
  v_anderson uuid; v_ana uuid;
begin
  begin -- tudo aqui dentro é desfeito no final
    delete from palpites; delete from rodadas; delete from mensagens;
    delete from sorteio; delete from exclusoes; delete from ajudantes;
    delete from itens_desejo; delete from participantes;

    insert into participantes (nome, email) values
      ('Adam','adambarra@gmail.com'), ('Ana Beatriz','anabeatrizsf7@gmail.com'),
      ('Anderson','a0a0coelho0@gmail.com'), ('André','andre1226fsa@gmail.com'),
      ('Annelise','annelise.3ac@gmail.com'), ('Augusto','a.c.a.a.c@hotmail.com'),
      ('Cecília','lemes.annelise@gmail.com'), ('Claudia','claudiamfm10@gmail.com'),
      ('Enzzo','shaf_00@hotmail.com'), ('Isabela','alemesisabela@gmail.com'),
      ('Janeider','janeider01@yahoo.co.uk'), ('Jéssica','jessica.azb26@gmail.com'),
      ('John','johnmadders@hotmail.co.uk'), ('Larissa','larissazamithb@gmail.com'),
      ('Leonor','alves.c4@gmail.com'), ('Letícia','narayanamartins@gmail.com'),
      ('Lourenço','acfarmacia@gmail.com'), ('Luís','luisaugusto.r.a.c@gmail.com'),
      ('Marcélia','marceliaaferreira@gmail.com'), ('Narayana','narayanaro@hotmail.com'),
      ('Renata','barrosorenata16@gmail.com'), ('Scheneider','scheneider.af@gmail.com'),
      ('Sérgio','vscoelho2003@yahoo.com.br'), ('Shirley','shirleyaf@gmail.com'),
      ('Suzana','suzanaferreiradossantos637@gmail.com'), ('Ubelina','ubelina.af@gmail.com');

    insert into exclusoes (participante_a, participante_b)
    select a.id, b.id
      from (values
        ('annelise.3ac@gmail.com',  'lemes.annelise@gmail.com'),
        ('annelise.3ac@gmail.com',  'alemesisabela@gmail.com'),
        ('narayanaro@hotmail.com',  'acfarmacia@gmail.com'),
        ('narayanaro@hotmail.com',  'narayanamartins@gmail.com'),
        ('narayanaro@hotmail.com',  'luisaugusto.r.a.c@gmail.com'),
        ('a.c.a.a.c@hotmail.com',   'acfarmacia@gmail.com'),
        ('a.c.a.a.c@hotmail.com',   'narayanamartins@gmail.com'),
        ('a.c.a.a.c@hotmail.com',   'luisaugusto.r.a.c@gmail.com'),
        ('anabeatrizsf7@gmail.com', 'barrosorenata16@gmail.com')
      ) x(ea, eb)
      join participantes a on a.email = x.ea
      join participantes b on b.email = x.eb;

    select id into v_anderson from participantes where email = 'a0a0coelho0@gmail.com';
    select id into v_ana      from participantes where email = 'anabeatrizsf7@gmail.com';

    for r in 1..p_rodadas loop
      delete from sorteio;
      begin
        perform realizar_sorteio('a0a0coelho0@gmail.com', 'anabeatrizsf7@gmail.com');
      exception when others then
        v_erro_execucao := v_erro_execucao + 1;
        continue;
      end;

      -- 1. tamanho
      if (select count(*) from sorteio) <> 26 then
        v_erro_tamanho := v_erro_tamanho + 1; continue;
      end if;
      -- 2. Anderson -> Ana Beatriz na posição 0
      if not exists (select 1 from sorteio where posicao_circulo = 0
                      and quem_da_id = v_anderson and quem_recebe_id = v_ana) then
        v_erro_primeiro := v_erro_primeiro + 1; continue;
      end if;
      -- 3. círculo único
      select count(*) into v_tmp
        from sorteio a
        join sorteio b on b.posicao_circulo = (a.posicao_circulo + 1) % 26
       where a.quem_recebe_id <> b.quem_da_id;
      if v_tmp > 0 or (select count(distinct quem_da_id) from sorteio) <> 26
                   or (select count(distinct quem_recebe_id) from sorteio) <> 26 then
        v_erro_circulo := v_erro_circulo + 1; continue;
      end if;
      -- 4. exclusões (nos dois sentidos)
      select count(*) into v_tmp
        from sorteio s join exclusoes e
          on (e.participante_a = s.quem_da_id and e.participante_b = s.quem_recebe_id)
          or (e.participante_b = s.quem_da_id and e.participante_a = s.quem_recebe_id);
      if v_tmp > 0 then
        v_erro_exclusao := v_erro_exclusao + 1; continue;
      end if;

      v_ok := v_ok + 1;
      select p.nome into v_nome
        from sorteio s join participantes p on p.id = s.quem_recebe_id
       where s.quem_da_id = v_ana;
      v_ana_tirou := jsonb_set(v_ana_tirou, array[v_nome],
                       to_jsonb(coalesce((v_ana_tirou ->> v_nome)::int, 0) + 1));
    end loop;

    raise exception using errcode = 'TSTRB', message = 'desfazer teste';
  exception when sqlstate 'TSTRB' then
    null; -- tudo o que foi feito no bloco acima é desfeito aqui
  end;

  item := 'RESULTADO'; resultado := case when v_ok = p_rodadas then '✅ APROVADO' else '❌ REPROVADO' end; return next;
  item := 'Rodadas'; resultado := p_rodadas::text; return next;
  item := 'Rodadas corretas'; resultado := v_ok::text; return next;
  item := 'Falha ao executar o sorteio'; resultado := v_erro_execucao::text; return next;
  item := 'Tamanho diferente de 26'; resultado := v_erro_tamanho::text; return next;
  item := 'Anderson não tirou Ana Beatriz'; resultado := v_erro_primeiro::text; return next;
  item := 'Círculo quebrado'; resultado := v_erro_circulo::text; return next;
  item := 'Exclusão violada'; resultado := v_erro_exclusao::text; return next;
  item := 'Ana Beatriz tirou a Renata'; resultado := coalesce(v_ana_tirou ->> 'Renata', '0') || ' vezes'; return next;
  item := 'Pessoas diferentes que a Ana Beatriz tirou'; resultado := (select count(*) from jsonb_object_keys(v_ana_tirou))::text || ' de 23 possíveis'; return next;
  for v_nome in select k from jsonb_object_keys(v_ana_tirou) k order by k loop
    item := '  Ana Beatriz → ' || v_nome; resultado := (v_ana_tirou ->> v_nome) || ' vezes'; return next;
  end loop;
end $function$;

revoke execute on function public.teste_sorteio(int) from public, anon, authenticated;

select * from public.teste_sorteio(1000);

-- Quando terminar os testes, apague a função:
-- drop function public.teste_sorteio(int);
