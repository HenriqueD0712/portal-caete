-- ============================================================
-- PORTAL ESTÚDIO CAETÉ — Script de Banco de Dados
-- Cole e execute no painel Supabase: SQL Editor > New query
-- ============================================================

-- 1. PERFIS DE CLIENTES
-- Estende a tabela de autenticação do Supabase automaticamente
-- ============================================================
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  nome        text not null,
  nome_projeto text,
  google_sheets_url text,
  created_at  timestamptz default now()
);

-- Cria automaticamente um perfil quando um usuário é criado no auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- 2. ARQUIVOS E ENTREGAS (sistema de tags/categorias)
-- categoria pode ser: 'orcamento', 'obra', 'marcenaria', 'marmoraria', 'ata', etc.
-- Para adicionar nova categoria no futuro: só altere o navigation.ts no frontend
-- ============================================================
create table if not exists arquivos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid references profiles(id) on delete cascade not null,
  nome         text not null,
  descricao    text,
  categoria    text not null,
  url          text not null,
  tipo_arquivo text,
  tamanho_bytes bigint,
  created_at   timestamptz default now()
);


-- 3. CRONOGRAMA
-- ============================================================
create table if not exists cronograma (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid references profiles(id) on delete cascade not null,
  titulo        text not null,
  descricao     text,
  data_prevista date not null,
  concluido     boolean default false,
  created_at    timestamptz default now()
);


-- 4. PROGRESSO DO PROJETO
-- etapa: 'criativo' ou 'executivo'
-- ============================================================
create table if not exists progresso (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references profiles(id) on delete cascade not null,
  etapa       text not null check (etapa in ('criativo', 'executivo')),
  item        text not null,
  percentual  integer default 0 check (percentual between 0 and 100),
  status      text default 'nao_iniciado' check (status in ('nao_iniciado', 'em_andamento', 'concluido')),
  ordem       integer default 0,
  created_at  timestamptz default now()
);


-- 5. APROVAÇÕES E REVISÕES
-- etapa: 'criativo' ou 'executivo'
-- comentario: preenchido pelo cliente apenas quando status = 'revisao' na etapa criativo
-- ============================================================
create table if not exists aprovacoes (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references profiles(id) on delete cascade not null,
  etapa       text not null check (etapa in ('criativo', 'executivo')),
  status      text not null default 'pendente' check (status in ('pendente', 'aprovado', 'revisao')),
  comentario  text,
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);


-- 6. REUNIÕES E ATAS
-- ============================================================
create table if not exists reunioes (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid references profiles(id) on delete cascade not null,
  data_reuniao date not null,
  assunto      text not null,
  ata_url      text,
  ata_texto    text,
  created_at   timestamptz default now()
);


-- 7. CUIDADOS COM O PROJETO
-- ============================================================
create table if not exists cuidados (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references profiles(id) on delete cascade not null,
  material    text not null,
  descricao   text not null,
  ordem       integer default 0,
  created_at  timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Cada cliente só vê seus dados
-- ============================================================

alter table profiles    enable row level security;
alter table arquivos    enable row level security;
alter table cronograma  enable row level security;
alter table progresso   enable row level security;
alter table aprovacoes  enable row level security;
alter table reunioes    enable row level security;
alter table cuidados    enable row level security;

-- Remove políticas antigas (seguro rodar múltiplas vezes)
drop policy if exists "cliente_select_own" on profiles;
drop policy if exists "cliente_update_own" on profiles;
drop policy if exists "cliente_select_own" on arquivos;
drop policy if exists "cliente_select_own" on cronograma;
drop policy if exists "cliente_select_own" on progresso;
drop policy if exists "cliente_select_own" on reunioes;
drop policy if exists "cliente_select_own" on cuidados;
drop policy if exists "cliente_select_own" on aprovacoes;
drop policy if exists "cliente_update_own" on aprovacoes;

-- Políticas: cliente só lê/escreve seus próprios dados
create policy "cliente_select_own" on profiles    for select using (auth.uid() = id);
create policy "cliente_update_own" on profiles    for update using (auth.uid() = id);

create policy "cliente_select_own" on arquivos    for select using (auth.uid() = cliente_id);
create policy "cliente_select_own" on cronograma  for select using (auth.uid() = cliente_id);
create policy "cliente_select_own" on progresso   for select using (auth.uid() = cliente_id);
create policy "cliente_select_own" on reunioes    for select using (auth.uid() = cliente_id);
create policy "cliente_select_own" on cuidados    for select using (auth.uid() = cliente_id);

-- Aprovações: cliente pode ver e ATUALIZAR (para aprovar/pedir revisão)
create policy "cliente_select_own" on aprovacoes  for select using (auth.uid() = cliente_id);
create policy "cliente_update_own" on aprovacoes  for update using (auth.uid() = cliente_id);


-- ============================================================
-- FUNÇÃO ADMIN: permite que o escritório (service_role) gerencie tudo
-- Não precisa de políticas extras — service_role bypassa o RLS
-- ============================================================
