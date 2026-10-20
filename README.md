# Plataforma del Estado — Ollas Comunes

Panel institucional para evaluar postulaciones de ollas comunes, decidir su aptitud y monitorear
la cobertura de beneficiarios. Es una aplicación interna: no tiene landing pública, no se indexa y
no implementa service worker.

- **Producción:** <https://purple-rock-067f00e0f.6.azurestaticapps.net>
- **API:** `https://api-ollas-prod-fhezb8atcxgmbrfa.eastus-01.azurewebsites.net/api`
- **Repositorio:** <https://github.com/4ndy3chenique/olla-comun-gob>

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 3.4 con el design system de las plataformas existentes
- React Router 7, React Hook Form y Zod
- Azure Static Web Apps (plan Free) y GitHub Actions

## Acceso y Roles

El ingreso es por DNI o correo y contraseña. La sesión usa un token opaco guardado en
`sessionStorage`; solo se conserva en `localStorage` si se marca **Recordarme**. Ante un `401` se
limpia la sesión y se redirige a `/login`.

| Rol | Alcance |
|---|---|
| `EVALUADOR` | Bandeja y detalle de solicitudes. Ve las asignadas y las no asignadas (solo lectura). Evalúa y decide únicamente las suyas. |
| `SUPERVISOR` | Todo lo del evaluador, asignación de casos, ollas, KPIs, cobertura y auditoría. |
| `ADMINISTRADOR` | Todo lo anterior, gestión de funcionarios, parámetros y reintentos de sincronización. |

Rutas del frontend:

| Ruta | Pantalla | Roles |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/` | Panel con indicadores y pendientes | Todos |
| `/solicitudes` | Bandeja con filtros y paginación | Todos |
| `/solicitudes/:id` | Expediente: Resumen, Integrantes, Evaluación, Decisiones, Bitácora y Notificaciones | Todos |
| `/ollas`, `/ollas/:id` | Monitoreo de ollas y beneficiarios | SUPERVISOR, ADMINISTRADOR |
| `/reportes` | KPIs y cobertura | SUPERVISOR, ADMINISTRADOR |
| `/auditoria` | Auditoría institucional | SUPERVISOR, ADMINISTRADOR |
| `/funcionarios` | Alta, edición y reseteo de funcionarios | ADMINISTRADOR |
| `/parametros` | Parámetros de evaluación y cálculo | ADMINISTRADOR |

## Desarrollo local

Requisitos: Node.js 20.19+ (o 22.12+) y la API local en el puerto `8010`.

```powershell
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

`npm run dev` sirve en <http://localhost:5175>. El archivo `.env.local.example` apunta a
`http://127.0.0.1:8010/api`. Para usar la API de producción, parte de `.env.example`.

Scripts:

- `npm run dev`: servidor de desarrollo en el puerto 5175.
- `npm run build`: verificación TypeScript y build de producción en `dist/`.
- `npm run preview`: previsualización del build.
- `npm run lint`: análisis estático con Oxlint.

## Seguridad

- Sin secretos ni credenciales en el repositorio; la URL de la API se inyecta en build time.
- Sin service worker ni caché de respuestas de la API.
- CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy` y `X-Robots-Tag: noindex`
  se aplican desde `public/staticwebapp.config.json`.
- `public/robots.txt` responde `Disallow: /`.
- El origen del SWA debe estar listado de forma exacta en `CORS_ORIGIN` de la API (sin `*` ni
  barra final).

## Despliegue

El workflow `.github/workflows/azure-static-web-apps-purple-rock-067f00e0f.yml` compila y publica
en cada push a `main`. Requiere:

- **Variable** `VITE_API_BASE_URL` con la URL de la API terminada en `/api`.
- **Secreto** `AZURE_STATIC_WEB_APPS_API_TOKEN_PURPLE_ROCK_067F00E0F` (ya configurado en el repo).

El workflow falla de forma explícita si la variable no existe. El origen de producción debe estar
en `CORS_ORIGIN` de `api-ollas-prod`; el valor esperado se documenta en `TRASPASO.md` §8.10.

> Si cambia la URL de la API, actualiza también `connect-src` en `public/staticwebapp.config.json`:
> la CSP se sirve como archivo estático y no lee variables de entorno.

## Documentación relacionada

- `../TRASPASO.md`: arquitectura, contratos, base de datos y despliegue.
- `../endpoints/README.md`: API completa, incluida `/api/estado/*`.
- `../bd/11_estado_plataforma.sql`: migración, tablas y parámetros de evaluación.
