-- Datos de demostración para el piloto en San Juan de Miraflores.
-- Usuarios:
--   admin@yara.pe   / Yara2026!  (ADMIN)
--   vecino@yara.pe  / Yara2026!  (USER)
--   vecina@yara.pe  / Yara2026!  (USER)

create or replace function pg_temp.create_user(p_id uuid, p_email text, p_name text, p_lastname text)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('Yara2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', p_name, 'lastname', p_lastname),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
end;
$$;

select pg_temp.create_user('11111111-1111-1111-1111-111111111111', 'admin@yara.pe',  'Administrador', 'YARA');
select pg_temp.create_user('22222222-2222-2222-2222-222222222222', 'vecino@yara.pe', 'Carlos', 'Quispe');
select pg_temp.create_user('33333333-3333-3333-3333-333333333333', 'vecina@yara.pe', 'María',  'Torres');

update public.profiles set role = 'ADMIN' where email = 'admin@yara.pe';

insert into public.incidents
  (user_id, incident_type_id, title, description, latitude, longitude, address, status, severity, occurred_at)
values
  ('22222222-2222-2222-2222-222222222222', 1, 'Robo a persona',
   'Dos sujetos en moto arrebataron el celular a una señora cerca del paradero. Huyeron hacia la Av. San Juan.',
   -12.15692, -76.97081, 'Av. Los Héroes cdra. 12', 'PUBLISHED', 'ALTA', now() - interval '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 2, 'Hurto',
   'Sustrajeron una mochila de una banca mientras el propietario jugaba con sus hijos.',
   -12.16010, -76.96520, 'Parque Zonal Huayna Cápac', 'CLOSED', 'MEDIA', now() - interval '1 day 3 hours'),
  ('33333333-3333-3333-3333-333333333333', 3, 'Acoso callejero',
   'Un hombre sigue a estudiantes a la salida del colegio por las tardes. Se ha visto varios días.',
   -12.15310, -76.97540, 'Jr. Las Flores cdra. 3', 'PUBLISHED', 'MEDIA', now() - interval '3 days'),
  ('33333333-3333-3333-3333-333333333333', 4, 'Robo a vivienda',
   'Forzaron la puerta de una casa en horas de la mañana mientras los dueños trabajaban.',
   -12.16420, -76.97210, 'Calle Lima cdra. 8', 'CLOSED', 'ALTA', now() - interval '5 days'),
  ('22222222-2222-2222-2222-222222222222', 5, 'Daños / Vandalismo',
   'Pintas y luminarias rotas en el parque. Zona queda a oscuras por la noche.',
   -12.15880, -76.96180, 'Parque El Olivar', 'PUBLISHED', 'BAJA', now() - interval '7 days'),
  ('33333333-3333-3333-3333-333333333333', 6, 'Actividad sospechosa',
   'Auto sin placas estacionado varias horas frente al mercado con dos personas observando.',
   -12.15050, -76.96900, 'Mercado Ciudad de Dios', 'PUBLISHED', 'MEDIA', now() - interval '30 minutes');

insert into public.incident_votes (incident_id, user_id, type) values
  (1, '33333333-3333-3333-3333-333333333333', 'CONFIRMADO'),
  (3, '22222222-2222-2222-2222-222222222222', 'YO_LO_VI'),
  (6, '22222222-2222-2222-2222-222222222222', 'IMPORTANTE');

insert into public.comments (incident_id, user_id, message) values
  (1, '33333333-3333-3333-3333-333333333333', 'Cuidado en ese paradero, ayer también pasó algo similar.'),
  (3, '22222222-2222-2222-2222-222222222222', 'Ya avisamos al serenazgo, piden reportar placas si se ve un vehículo.');
