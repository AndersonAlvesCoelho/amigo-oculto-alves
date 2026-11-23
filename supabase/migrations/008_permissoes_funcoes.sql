-- 008: funções só para usuários logados (antes: qualquer um, até sem login)

-- usadas pelo app e pelas regras de segurança (RLS)
revoke execute on function public.meu_participante_id()      from public, anon;
revoke execute on function public.sou_admin()                from public, anon;
revoke execute on function public.participantes_que_ajudo()  from public, anon;
revoke execute on function public.minhas_conversas()         from public, anon;
revoke execute on function public.votar(uuid)                from public, anon;
revoke execute on function public.ranking()                  from public, anon;
revoke execute on function public.jogo_proxima_rodada()      from public, anon;
revoke execute on function public.jogo_revelar()             from public, anon;
revoke execute on function public.prazo_votacao()            from public, anon;
grant execute on function public.meu_participante_id()       to authenticated;
grant execute on function public.sou_admin()                 to authenticated;
grant execute on function public.participantes_que_ajudo()   to authenticated;
grant execute on function public.minhas_conversas()          to authenticated;
grant execute on function public.votar(uuid)                 to authenticated;
grant execute on function public.ranking()                   to authenticated;
grant execute on function public.jogo_proxima_rodada()       to authenticated;
grant execute on function public.jogo_revelar()              to authenticated;
grant execute on function public.prazo_votacao()             to authenticated;

-- não usadas diretamente por ninguém (gatilhos e a antiga "encerrar votação")
revoke execute on function public.jogo_encerrar_votacao()    from public, anon, authenticated;
revoke execute on function public.set_atualizado_em()        from public, anon, authenticated;
revoke execute on function public.vincular_ajudante()        from public, anon, authenticated;
revoke execute on function public.vincular_usuario()         from public, anon, authenticated;

-- funções criadas daqui para frente não ficam abertas para todos
alter default privileges in schema public revoke execute on functions from public;
