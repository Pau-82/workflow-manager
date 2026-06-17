# Workflow Manager

App fullstack para **crear y gestionar workflows de alertas**: definís una condición de
disparo, simulás valores observados y, cuando se cumple, se registra un evento y se generan
notificaciones in-app — todo con seguridad de tipos de punta a punta.

## Stack

- **Backend:** NestJS 11 + [tRPC](https://trpc.io/) 11
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Datos:** Prisma 7 + PostgreSQL 16
- **Monorepo:** NX 22 (pnpm workspaces)
- **Validación:** Zod (schemas compartidos entre back y front)

## Prerequisitos

- **Node ≥ 20.9** (requerido por Next 16; probado en Node 24).
- **pnpm** — es el gestor del repo (hay `pnpm-lock.yaml`). Si no lo tenés: `npm i -g pnpm`.
- **Docker** + Docker Compose — para correr PostgreSQL localmente.

## Setup paso a paso

Sobre un clon limpio, en orden. Cada bloque es copiable.

> 💡 **¿npm o pnpm?** Los **scripts** (`dev`, `test`, `seed`, `prisma:migrate`, etc.) también
> se pueden correr con `npm run` — p. ej. `npm run dev` en lugar de `pnpm dev`. Pero la
> **instalación** debe hacerse con `pnpm install` (el repo es un workspace de pnpm) y pnpm
> tiene que estar instalado: algunos scripts lo invocan internamente.

**1. Clonar e instalar dependencias**

```bash
git clone https://github.com/Pau-82/workflow-manager.git
cd workflow-manager
pnpm install
```

**2. Crear el archivo de entorno** (mismas credenciales que el docker-compose)

```bash
cp .env.example .env
```

> En Windows (CMD/PowerShell): `copy .env.example .env`

El `.env` solo necesita la `DATABASE_URL` (ya viene lista en `.env.example`):

```
DATABASE_URL="postgresql://wfm:wfm_password@localhost:5432/workflow_manager?schema=public"
```

**3. Levantar PostgreSQL** (Docker, queda en el puerto `5432`)

```bash
pnpm db:up
```

> Postgres 16 · usuario `wfm` · password `wfm_password` · base `workflow_manager`.

**4. Crear el esquema de la base** (aplica migraciones y genera el cliente Prisma)

```bash
pnpm prisma:migrate
```

**5. Cargar datos de ejemplo** (workflows, eventos y notificaciones)

```bash
pnpm seed
```

**6. Levantar backend y frontend** (juntos)

```bash
pnpm dev
```

Quedan corriendo en:

| Servicio | URL |
|----------|-----|
| **Frontend** (Next.js) | http://localhost:3000 |
| **API** (NestJS) | http://localhost:3001/api |
| **tRPC** (endpoint) | http://localhost:3001/trpc |

Abrí **http://localhost:3000** y listo.

## Cómo usar la app

1. **Crear un workflow** — en `/workflows`, botón *Nuevo workflow*. Elegí el tipo de disparo,
   completá sus parámetros, escribí un mensaje y agregá al menos un destinatario *in-app*.
   Guardá.
2. **Activarlo** — en la lista, usá el toggle *Activar*. Un workflow nace inactivo y no
   dispara hasta activarlo.
3. **Simular un disparo** — entrá al detalle con *Ver*, ingresá un valor observado y apretá
   *Simular*. Si se cumple la condición → **"Disparó"** y se crea un evento.
4. **Ver el evento** — en `/history` aparece el evento **Abierto**, con su contexto y mensaje.
5. **Resolverlo** — botón *Resolver*. Podés dejar una nota. Pasa a **Resuelto**.
6. **Ver notificaciones** — en `/notifications` está la notificación in-app generada por el
   disparo.

> Detalle del modelo: un workflow tiene **a lo sumo un evento abierto a la vez**. Si simulás
> de nuevo con un evento ya abierto, la respuesta es *"ya existe un evento abierto"* y no se
> crea otro. Resolvé el evento y volvé a simular para generar uno nuevo.

## Tests

```bash
pnpm test
```

> Incluye un **test de integración del UnitOfWork** que usa la base real, así que necesitás
> Postgres levantado (`pnpm db:up`) para correr la suite completa.

Otros comandos útiles:

```bash
pnpm typecheck   # type-check de todo el workspace
pnpm lint        # lint de todo el workspace
pnpm build       # build de producción de todos los proyectos
```

## Arquitectura (breve)

Backend en **DDD táctico + arquitectura hexagonal**. Un único **bounded context**
(`workflow-manager`) organizado en **tres módulos** —**workflows**, **alerts** y
**notifications**— como *vertical slices* sobre NX, cada uno con sus capas
`domain` / `application` / `infrastructure`. El dominio es puro: no conoce el framework ni la
base. La aplicación orquesta los casos de uso dependiendo de **puertos** (interfaces). Del
lado de **salida**, los adaptadores Prisma implementan esos puertos (repositorios,
`NotificationCreator`, `UnitOfWork`). Del lado de **entrada**, tRPC es el adaptador que
**invoca directamente los casos de uso** (no implementa un puerto) y traduce su `Result` a la
respuesta —o a un `TRPCError`.

## Decisiones de diseño destacadas

- **Seguridad de tipos de punta a punta.** El frontend infiere los tipos del `AppRouter` de
  tRPC (cero `any`); los formularios validan con los **mismos schemas Zod** que valida el
  backend, compartidos en la lib `contracts`.
- **Errores por capas sin excepciones.** El dominio y la aplicación nunca tiran: devuelven un
  `Result<T, E>` con `LayeredError` (contexto/tipo/capa). Solo la frontera tRPC traduce a
  `TRPCError` con el código HTTP correcto (404 / 409 / 400 / 500).
- **Modelado rico con Value Objects y uniones discriminadas.** Estados inválidos
  irrepresentables: p. ej. la resolución de un evento es `Open | Resolved` (un evento resuelto
  *siempre* tiene fecha), y las condiciones de disparo son `Threshold | Variance`.
- **Atomicidad con UnitOfWork.** Al disparar, el `AlertEvent` y sus notificaciones in-app se
  persisten en **una sola transacción** (todo o nada); los emails se envían post-commit.
- **No-duplicados con defensa en profundidad.** La regla "un evento abierto por workflow" se
  chequea en la aplicación *y* se garantiza con un **índice único parcial** en PostgreSQL
  (`UNIQUE(workflowId) WHERE status = 'abierto'`), capturando incluso carreras concurrentes.

---

Hecho con NestJS, tRPC, Next.js, Prisma y PostgreSQL sobre NX.
