-- =====================================================================
-- YARA – Esquema inicial (basado en el ERD del Entregable 2)
-- Adaptaciones para Supabase:
--   * "users" -> public.profiles, vinculado 1:1 a auth.users.
--     La contraseña la gestiona Supabase Auth (hash bcrypt), no se guarda aquí.
--   * incidents.occurred_at: fecha y hora del incidente (formulario del mockup).
--   * incident_status incluye HIDDEN para "ocultar" incidentes inapropiados (BPMN, paso C).
--   * alerts.incident_id es opcional: un comunicado del administrador no tiene incidente.
-- =====================================================================

create type public.user_role       as enum ('USER', 'ADMIN');
create type public.user_status     as enum ('ACTIVE', 'INACTIVE');
create type public.incident_status as enum ('PENDING', 'PUBLISHED', 'CLOSED', 'HIDDEN');
create type public.severity_level  as enum ('BAJA', 'MEDIA', 'ALTA');
create type public.alert_status    as enum ('ACTIVE', 'EXPIRED', 'CLOSED');
create type public.vote_type       as enum ('CONFIRMADO', 'YO_LO_VI', 'IMPORTANTE');

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        varchar(100) not null default '',
  lastname    varchar(100) not null default '',
  email       varchar(150) not null unique,
  phone       varchar(20),
  avatar_url  varchar(255),
  role        public.user_role   not null default 'USER',
  status      public.user_status not null default 'ACTIVE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.incident_types (
  id           serial primary key,
  name         varchar(100) not null unique,
  icon         varchar(50)  not null,
  color        varchar(20)  not null,
  description  varchar(255)
);

create table public.incidents (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  incident_type_id  int  not null references public.incident_types (id),
  title             varchar(150) not null,
  description       text not null check (char_length(description) between 10 and 500),
  latitude          numeric(10, 8) not null check (latitude between -90 and 90),
  longitude         numeric(11, 8) not null check (longitude between -180 and 180),
  address           varchar(255) not null,
  status            public.incident_status not null default 'PUBLISHED',
  severity          public.severity_level  not null default 'MEDIA',
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index incidents_user_idx   on public.incidents (user_id);
create index incidents_status_idx on public.incidents (status, occurred_at desc);

create table public.incident_files (
  id           bigint generated always as identity primary key,
  incident_id  bigint not null references public.incidents (id) on delete cascade,
  file_url     varchar(255) not null,
  file_type    varchar(50)  not null,
  created_at   timestamptz not null default now()
);
create index incident_files_incident_idx on public.incident_files (incident_id);

create table public.alerts (
  id            bigint generated always as identity primary key,
  incident_id   bigint references public.incidents (id) on delete cascade,
  title         varchar(150) not null,
  message       text not null,
  status        public.alert_status not null default 'ACTIVE',
  published_at  timestamptz not null default now(),
  expires_at    timestamptz
);

create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references public.profiles (id) on delete cascade,
  alert_id    bigint not null references public.alerts (id) on delete cascade,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, read, created_at desc);

create table public.comments (
  id           bigint generated always as identity primary key,
  incident_id  bigint not null references public.incidents (id) on delete cascade,
  user_id      uuid   not null references public.profiles (id) on delete cascade,
  message      text   not null check (char_length(message) between 1 and 500),
  created_at   timestamptz not null default now()
);
create index comments_incident_idx on public.comments (incident_id, created_at);

create table public.incident_votes (
  id           bigint generated always as identity primary key,
  incident_id  bigint not null references public.incidents (id) on delete cascade,
  user_id      uuid   not null references public.profiles (id) on delete cascade,
  type         public.vote_type not null,
  created_at   timestamptz not null default now(),
  unique (incident_id, user_id, type)
);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles (id) on delete set null,
  action      varchar(100) not null,
  entity      varchar(50)  not null,
  entity_id   bigint,
  ip          varchar(45),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN' and status = 'ACTIVE'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'ACTIVE'
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger incidents_updated_at before update on public.incidents
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse un usuario en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, lastname, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'lastname', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un vecino no puede cambiar su propio rol ni estado.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status
      or new.email is distinct from old.email)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'No autorizado para modificar rol, estado o correo';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Un vecino siempre publica con estado PUBLISHED; solo el admin decide otro estado.
create or replace function public.guard_incident_insert()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := 'PUBLISHED';
  end if;
  return new;
end;
$$;

create trigger incidents_guard_insert before insert on public.incidents
  for each row execute function public.guard_incident_insert();

-- BPMN 2.3: publicar alerta y notificar a los usuarios al registrar un incidente.
create or replace function public.publish_incident_alert()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_type_name text;
  v_alert_id  bigint;
begin
  if new.status <> 'PUBLISHED' then
    return new;
  end if;

  select name into v_type_name from public.incident_types where id = new.incident_type_id;

  insert into public.alerts (incident_id, title, message, expires_at)
  values (
    new.id,
    v_type_name || ' en ' || new.address,
    left(new.description, 280),
    now() + interval '24 hours'
  )
  returning id into v_alert_id;

  -- Piloto en una sola comunidad: se notifica a todos los vecinos activos.
  insert into public.notifications (user_id, alert_id)
  select p.id, v_alert_id
  from public.profiles p
  where p.status = 'ACTIVE' and p.id <> new.user_id;

  return new;
end;
$$;

create trigger incidents_publish_alert after insert on public.incidents
  for each row execute function public.publish_incident_alert();

-- Bitácora de auditoría de acciones sobre incidentes.
create or replace function public.audit_incident_changes()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (user_id, action, entity, entity_id)
    values (auth.uid(), 'CREATE', 'incidents', new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.audit_logs (user_id, action, entity, entity_id)
    values (auth.uid(), 'STATUS_' || old.status || '_TO_' || new.status, 'incidents', new.id);
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (user_id, action, entity, entity_id)
    values (auth.uid(), 'DELETE', 'incidents', old.id);
    return old;
  end if;
  return new;
end;
$$;

create trigger incidents_audit after insert or update or delete on public.incidents
  for each row execute function public.audit_incident_changes();

-- BPMN D: el administrador envía un aviso o comunicado a todos los vecinos.
create or replace function public.send_announcement(p_title text, p_message text)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare
  v_alert_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede enviar comunicados';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_message), '') = '' then
    raise exception 'Título y mensaje son obligatorios';
  end if;

  insert into public.alerts (title, message, expires_at)
  values (left(p_title, 150), left(p_message, 1000), now() + interval '7 days')
  returning id into v_alert_id;

  insert into public.notifications (user_id, alert_id)
  select id, v_alert_id from public.profiles where status = 'ACTIVE';

  insert into public.audit_logs (user_id, action, entity, entity_id)
  values (auth.uid(), 'ANNOUNCEMENT', 'alerts', v_alert_id);

  return v_alert_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Vistas públicas (sin datos del autor: "Tu reporte es anónimo")
-- Las vistas se ejecutan con los permisos del propietario, por lo que
-- exponen únicamente las columnas y filas aquí definidas.
-- ---------------------------------------------------------------------
create view public.incident_feed as
select
  i.id,
  i.incident_type_id,
  t.name  as type_name,
  t.icon  as type_icon,
  t.color as type_color,
  i.title,
  i.description,
  i.latitude,
  i.longitude,
  i.address,
  i.status,
  i.severity,
  i.occurred_at,
  i.created_at,
  (select f.file_url from public.incident_files f
     where f.incident_id = i.id order by f.id limit 1)                     as cover_url,
  (select count(*) from public.incident_votes v where v.incident_id = i.id) as votes_count,
  (select count(*) from public.comments c where c.incident_id = i.id)       as comments_count
from public.incidents i
join public.incident_types t on t.id = i.incident_type_id
where i.status in ('PUBLISHED', 'CLOSED');

create view public.comment_feed as
select
  c.id,
  c.incident_id,
  c.user_id,
  c.message,
  c.created_at,
  trim(p.name || ' ' || left(p.lastname, 1) || case when p.lastname <> '' then '.' else '' end) as author
from public.comments c
join public.profiles p on p.id = c.user_id;

grant select on public.incident_feed to anon, authenticated;
grant select on public.comment_feed  to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.incident_types enable row level security;
alter table public.incidents      enable row level security;
alter table public.incident_files enable row level security;
alter table public.alerts         enable row level security;
alter table public.notifications  enable row level security;
alter table public.comments       enable row level security;
alter table public.incident_votes enable row level security;
alter table public.audit_logs     enable row level security;

-- profiles
create policy "perfil propio o admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "editar perfil propio" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin edita perfiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- incident_types
create policy "tipos visibles" on public.incident_types
  for select to anon, authenticated using (true);
create policy "admin gestiona tipos" on public.incident_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- incidents (lectura pública vía incident_feed; la tabla solo para dueño/admin)
create policy "ver incidentes propios o admin" on public.incidents
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "crear incidente propio" on public.incidents
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
create policy "admin actualiza incidentes" on public.incidents
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin elimina incidentes" on public.incidents
  for delete to authenticated using (public.is_admin());

-- incident_files
create policy "archivos visibles" on public.incident_files
  for select to anon, authenticated using (true);
create policy "adjuntar a incidente propio" on public.incident_files
  for insert to authenticated with check (
    exists (select 1 from public.incidents i where i.id = incident_id and i.user_id = auth.uid())
  );

-- alerts
create policy "alertas visibles" on public.alerts
  for select to authenticated using (true);

-- notifications
create policy "mis notificaciones" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "marcar notificaciones" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- comments
create policy "comentarios visibles" on public.comments
  for select to authenticated using (true);
create policy "comentar" on public.comments
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
create policy "borrar comentario propio o admin" on public.comments
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- incident_votes
create policy "votos visibles" on public.incident_votes
  for select to authenticated using (true);
create policy "votar" on public.incident_votes
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
create policy "quitar voto" on public.incident_votes
  for delete to authenticated using (user_id = auth.uid());

-- audit_logs
create policy "admin lee bitácora" on public.audit_logs
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- Realtime: notificaciones del usuario y nuevas alertas
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.alerts;

-- ---------------------------------------------------------------------
-- Storage: fotos de incidentes (JPG/PNG/WEBP, máx. 5 MB)
-- Ruta: <user_id>/<incident_id>/<archivo>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('incident-files', 'incident-files', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp']);

create policy "subir fotos propias" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'incident-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "ver fotos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'incident-files');

-- ---------------------------------------------------------------------
-- Catálogo de tipos de incidente (mockups)
-- ---------------------------------------------------------------------
insert into public.incident_types (name, icon, color, description) values
  ('Robo a persona',        'robbery',    '#1d4ed8', 'Sustracción con violencia o intimidación a una persona'),
  ('Hurto',                 'theft',      '#16a34a', 'Sustracción sin violencia (celular, cartera, autopartes)'),
  ('Acoso callejero',       'harassment', '#ea580c', 'Conductas de acoso en la vía pública'),
  ('Robo a vivienda',       'house',      '#1d4ed8', 'Ingreso no autorizado a domicilio o negocio'),
  ('Daños / Vandalismo',    'vandalism',  '#ea580c', 'Daños a la propiedad pública o privada'),
  ('Actividad sospechosa',  'suspicious', '#9333ea', 'Personas o vehículos con comportamiento sospechoso'),
  ('Consumo en vía pública','alcohol',    '#ca8a04', 'Consumo de alcohol o drogas en la vía pública');
