-- ============================================================
-- VISIBILIDADE POR CLIENTE + LINK SECRETO DO 360°
-- Cole e execute no painel Supabase: SQL Editor > New query
-- (seguro rodar mais de uma vez)
-- ============================================================

create table if not exists portal_config (
  cliente_id     uuid primary key references profiles(id) on delete cascade,
  secoes_ocultas text[]  not null default '{}',   -- ids dos menus escondidos do cliente
  link360_token  text unique,                     -- código secreto do link do 360°
  link360_ativo  boolean not null default false   -- link liberado ou não
);

-- RLS ligado e SEM nenhuma política: o cliente não consegue ler nem alterar
-- esta tabela pelo navegador. Só o servidor do portal (service_role) acessa.
alter table portal_config enable row level security;
