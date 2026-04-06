# FLORA PLANER

Tablero interno para seguimiento de branding de un cafe de especialidad en Cartagena de Indias.

## Incluye

- Login con cuenta administradora principal.
- Gestion de usuarios de acceso (solo admin crea, edita y elimina usuarios).
- Dashboard general con proyectos, tareas, reuniones y progreso.
- Modulos: `Proyectos`, `Tareas`, `Metas`, `Reuniones`, `Proceso`, `Galeria`, `Timeline`, `Semanal`, `Equipo`, `Perfil`.
- Galeria de seguimiento del proceso:
  - pieza base + version
  - categoria (`Logo`, `Paleta`, `Packaging`, `Interior`, `Redes`, `Otro`)
  - etapa (`Investigacion`, `Bocetos`, `Propuesta`, `Ajustes`, `Final`)
  - estado (`Pendiente`, `En revision`, `Aprobado`, `Descartado`)
  - comentarios por pieza
- Persistencia local en `data/planner-data.json` (dev) o Postgres en Vercel (produccion).

## Credenciales iniciales (local)

- `admin@floraplaner.local` / `flora123`

## Variables recomendadas

- `FLORA_PLANER_SESSION_SECRET` (o `FLORA_PLANNER_SESSION_SECRET`, `AUTH_SECRET`, `NEXTAUTH_SECRET`)
- `FLORA_PLANER_ADMIN_EMAIL`
- `FLORA_PLANER_ADMIN_PASSWORD`
- `POSTGRES_URL` o `DATABASE_URL` para persistencia en Vercel
- `BLOB_READ_WRITE_TOKEN` para subir imagenes a Vercel Blob

Fallback de emergencia (desactivado por defecto):

- `FLORA_PLANER_ENABLE_FALLBACK_LOGIN=true`

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run lint
npm run build
```
