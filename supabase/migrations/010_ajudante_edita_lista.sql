-- 010: o ajudante pode montar a lista de desejos de quem ele ajuda.
-- As regras antigas (cada participante mexe na própria lista) continuam;
-- estas se somam a elas.

drop policy if exists "ajudante adiciona na lista" on public.itens_desejo;
drop policy if exists "ajudante edita a lista"     on public.itens_desejo;
drop policy if exists "ajudante apaga da lista"    on public.itens_desejo;

create policy "ajudante adiciona na lista" on public.itens_desejo
  for insert to authenticated
  with check (participante_id in (select participantes_que_ajudo()));

create policy "ajudante edita a lista" on public.itens_desejo
  for update to authenticated
  using (participante_id in (select participantes_que_ajudo()))
  with check (participante_id in (select participantes_que_ajudo()));

create policy "ajudante apaga da lista" on public.itens_desejo
  for delete to authenticated
  using (participante_id in (select participantes_que_ajudo()));
