# YARA — Plataforma de Prevención y Alertas de Seguridad Ciudadana (MVP)

Prototipo funcional del proyecto YARA (Grupo 5 · CIBERTEC). Stack definido en el Entregable 2:

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 → despliegue en **Vercel**
- **Backend:** **Supabase** — PostgreSQL con Row Level Security, Supabase Auth, Realtime y Storage
- **Mapas:** Leaflet + OpenStreetMap (sin API key); búsqueda de direcciones con Nominatim

## Funcionalidades del MVP

| Módulo | Detalle |
| --- | --- |
| Registro y autenticación | Registro con consentimiento (Ley N.° 29733), login, rutas protegidas por `proxy.ts`, roles USER / ADMIN |
| Registro de incidentes | Tipo, ubicación (búsqueda, GPS o marcador arrastrable), fecha y hora, gravedad, descripción (500 car.) y hasta 3 fotos |
| Alertas en tiempo real | Al publicar un reporte, un trigger crea la alerta y notifica a los vecinos; campana + aviso emergente vía Supabase Realtime |
| Mapa y listado | Mapa de alertas con filtros por periodo, estado y tipo (BPMN paso 7) |
| Mis reportes | Pestañas Todos / En proceso / Atendidos con paginación |
| Detalle | Fotos, mapa, validación comunitaria (Confirmo / Yo lo vi / Importante) y comentarios |
| Administración | Indicadores, moderación (atendido / ocultar / eliminar), comunicados a todos, gestión de usuarios y bitácora de auditoría |
| Privacidad | Los reportes son anónimos: la vista pública `incident_feed` no expone al autor |

El modelo de datos sigue el ERD del entregable (`supabase/migrations/20261010000000_init.sql`).

## Ejecutar en local

Requisitos: Node 20+, Docker.

```bash
npm install
npx supabase start          # levanta Postgres, Auth, Realtime y Storage; aplica migración y seed
cp .env.example .env.local  # usa la URL y PUBLISHABLE_KEY que imprime "supabase start"
npm run dev                 # http://localhost:3000
```

Cuentas de demostración (contraseña `Yara2026!`): `vecino@yara.pe`, `vecina@yara.pe`, `admin@yara.pe` (ADMIN).

- Studio (BD): http://127.0.0.1:54323 · Reiniciar datos: `npx supabase db reset`

## Despliegue (entorno de pruebas)

1. Crear un proyecto en Supabase y aplicar el esquema: `npx supabase link --project-ref <ref> && npx supabase db push`.
   El `seed.sql` es solo para local (crea usuarios demo); en la nube crea el admin registrándote y ejecutando
   `update profiles set role = 'ADMIN' where email = '<tu-correo>';`.
2. En Supabase → Authentication → URL Configuration, define la URL del sitio de Vercel.
3. Importar el repo en Vercel y configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Fuera de alcance del MVP (según sección 2.2)

Integración con PNP / municipalidades, validación oficial de reportes, apps nativas, notificaciones por
correo/push y notificación por cercanía geográfica (hoy se notifica a toda la comunidad piloto).
