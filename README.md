# Control de Gastos

Control de Gastos es una aplicación web para llevar el control del dinero personal. Permite guardar los ingresos, los gastos y llevar un registro separado de eventos que tienen un presupuesto.

El proyecto fue realizado con TypeScript y está dividido en dos partes:

- **Frontend:** es la parte que ve y usa la persona desde el navegador.
- **Backend:** es la parte que recibe las solicitudes, revisa los datos y se comunica con la base de datos.

## ¿Qué se puede hacer?

- Crear una cuenta e iniciar sesión.
- Iniciar sesión con usuario y contraseña.
- Guardar, editar y eliminar ingresos.
- Guardar, editar y eliminar gastos.
- Separar los gastos por categoría y por tipo fijo o variable.
- Guardar, editar y eliminar eventos con presupuesto, solo como registro.
- Ver un resumen de ingresos, gastos y dinero disponible.
- Usar quetzales o dólares.
- Cambiar el tema claro u oscuro del perfil.
- Buscar información desde el buscador general.
- Mantener los datos separados: cada persona solo puede ver sus propios registros.

Los eventos son independientes de los ingresos y los gastos. El presupuesto de un evento sirve únicamente para tener anotada la planificación; no se suma a los gastos, no descuenta dinero disponible y no modifica los ingresos.

## Buscador actualizado

El buscador general está disponible en la barra superior de las pantallas principales. Puede encontrar información de:

- Ingresos: descripción, lugar, fecha, moneda y cantidades.
- Gastos: descripción, lugar, categoría, tipo, fecha, moneda, monto y deuda.
- Eventos: nombre, tipo, lugar, fecha, invitados, presupuesto y estado.
- Perfil: usuario, correo, nombre, apellido, moneda, tema y rol.

Cuando se agrega, modifica o elimina un registro, el buscador recibe el cambio automáticamente. Además, revisa el servidor cada pocos segundos para encontrar cambios recientes sin cerrar sesión ni actualizar manualmente la página.

El buscador no muestra contraseñas. Las consultas de la aplicación siempre se hacen usando el usuario de la sesión actual.

## Tecnologías utilizadas

### Frontend

- **Angular:** construye las pantallas de la aplicación.
- **TypeScript:** lenguaje usado para programar la aplicación.
- **Angular Router:** permite cambiar de pantalla sin recargar toda la página.
- **HttpClient:** permite que el frontend se comunique con el backend.
- **RxJS:** ayuda a actualizar la información cuando cambian los datos.
- **Angular Forms:** permite crear los formularios de registro y edición.
- **Componentes independientes:** cada pantalla tiene sus propios archivos y funciones.

### Backend

- **Node.js:** permite ejecutar JavaScript y TypeScript en el servidor.
- **Express:** recibe las solicitudes del frontend y define las rutas.
- **TypeScript:** ayuda a escribir el código del servidor.
- **PostgreSQL:** guarda la información de los usuarios, ingresos, gastos y eventos.
- **pg:** conecta el backend con PostgreSQL.
- **JWT:** crea la sesión del usuario después de iniciar sesión.
- **bcryptjs:** protege las contraseñas guardándolas de forma cifrada.
- **dotenv:** lee las configuraciones guardadas en el archivo `.env`.
- **CORS:** permite la comunicación entre el frontend y el backend.
- **Google Identity Services:** permite preparar el inicio de sesión con Google.

### Otras herramientas

- **pnpm:** instala las librerías del proyecto.
- **Git:** puede usarse para guardar el historial de cambios.
- **PostgreSQL:** debe estar instalado y funcionando en el equipo.

## Requisitos antes de instalar

Se necesita tener instalado:

- Node.js LTS, preferiblemente la versión 18 o superior.
- pnpm.
- PostgreSQL.
- Git, si se desea descargar el proyecto desde un repositorio.

Para revisar las versiones:

```bash
node -v
pnpm -v
psql --version
```

## Instalación paso a paso

### 1. Descargar el proyecto

Si el proyecto está en un repositorio Git, se puede descargar así:

```bash
git clone URL_DEL_PROYECTO
cd Control_De_Gastos
```

Si ya se tiene la carpeta, solo se debe abrir una terminal dentro de ella.

### 2. Crear la base de datos

Abrir PostgreSQL y crear una base de datos llamada `control_de_gastos`:

```sql
CREATE DATABASE control_de_gastos;
```

Después, se puede cargar el archivo de tablas:

```bash
cd backend/src/config
psql -U postgres -d control_de_gastos -f control_de_gastos.sql
```

El archivo SQL crea estas tablas:

- `usuarios`: datos de las cuentas y preferencias.
- `ingresos`: dinero que recibe cada usuario.
- `gastos`: pagos y gastos registrados.
- `eventos`: planes que tienen un presupuesto propio, sin afectar las otras tablas.

El backend también revisa y prepara la base de datos cuando se inicia.

### 3. Crear el archivo de configuración

Dentro de la carpeta `backend`, crear un archivo llamado `.env` con los datos de PostgreSQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=control_de_gastos
JWT_SECRET=una_clave_larga_y_segura
JWT_EXPIRES_IN=30m

GOOGLE_AUTH_ENABLED=false
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=
TRADITIONAL_AUTH_ENABLED=true
```

Se deben cambiar `DB_PASSWORD` y `JWT_SECRET` por valores propios. El archivo `.env` no debe compartirse ni subirse a un repositorio público.

### 4. Instalar y ejecutar el backend

En una terminal:

```bash
cd backend
pnpm install
pnpm run dev
```

El backend queda disponible en:

```text
http://localhost:3000
```

### 5. Instalar y ejecutar el frontend

Abrir otra terminal, sin cerrar la anterior:

```bash
cd frontend
pnpm install
pnpm start
```

La aplicación queda disponible en:

```text
http://localhost:4200
```

Se debe abrir esa dirección en el navegador.

## Usuario de prueba

El archivo SQL incluye este usuario administrador:

- Usuario: `admin`
- Correo: `manu@gmail.com`
- Contraseña: `admin123`

También se puede crear una cuenta nueva desde la pantalla de registro.

## ¿Cómo está organizado el proyecto?

```text
Control_De_Gastos/
├── backend/
│   ├── app.ts                 Configuración principal de Express
│   ├── server.ts              Inicia el servidor y la base de datos
│   └── src/
│       ├── config/            Conexión y archivo SQL
│       ├── middleware/        Revisión de errores y sesión
│       ├── modules/
│       │   ├── auth/          Registro, login y perfil
│       │   ├── dashboard/     Resumen de la información
│       │   ├── events/        Operaciones de eventos
│       │   ├── expensive/     Operaciones de gastos
│       │   └── ingresos/      Operaciones de ingresos
│       └── util/              Funciones relacionadas con JWT
│
├── frontend/
│   └── src/app/
│       ├── core/              Servicios, modelos e interceptor
│       ├── features/          Pantallas de la aplicación
│       └── shared/            Elementos compartidos, como el menú
│
└── README.md                  Esta guía
```

## ¿Qué significa cada tipo de archivo?

El proyecto usa una organización sencilla:

- **Componentes:** controlan las pantallas y los botones que usa la persona.
- **HTML:** contiene la estructura visible de cada pantalla.
- **CSS:** define colores, tamaños y distribución.
- **Servicios del frontend:** hacen las solicitudes al backend y mantienen los datos actualizados.
- **Rutas:** indican qué dirección de la aplicación debe responder.
- **Controladores:** reciben una solicitud y devuelven una respuesta.
- **Servicios del backend:** contienen las operaciones que se hacen sobre la base de datos.
- **Middleware:** revisa cosas comunes, como si la sesión es válida.
- **Modelos e interfaces:** describen qué datos maneja cada parte.

Por ejemplo, al guardar un gasto:

1. La persona llena el formulario en el frontend.
2. El servicio del frontend envía los datos al backend.
3. La ruta dirige la solicitud al controlador.
4. El controlador llama al servicio del backend.
5. El servicio guarda el gasto en PostgreSQL.
6. El frontend vuelve a cargar la lista y actualiza el buscador.

## Rutas principales del backend

Todas las rutas de datos necesitan una sesión válida:

```text
POST   /api/auth/register       Crear cuenta
POST   /api/auth/login          Iniciar sesión
GET    /api/auth/profile        Consultar perfil
PUT    /api/auth/profile        Actualizar perfil

GET    /api/ingresos            Ver ingresos del usuario
POST   /api/ingresos            Crear ingreso
PUT    /api/ingresos/:id        Editar ingreso
DELETE /api/ingresos/:id        Eliminar ingreso

GET    /api/expensive           Ver gastos del usuario
POST   /api/expensive           Crear gasto
PUT    /api/expensive/:id       Editar gasto
DELETE /api/expensive/:id       Eliminar gasto

GET    /api/eventos             Ver eventos del usuario
POST   /api/eventos             Crear evento
PUT    /api/eventos/:id         Editar evento
DELETE /api/eventos/:id         Eliminar evento

GET    /api/dashboard           Ver resumen financiero
```

## Seguridad y separación de datos

- El usuario recibe un token JWT al iniciar sesión.
- El frontend envía ese token en las solicitudes protegidas.
- El backend revisa el token antes de entregar información.
- Las consultas usan el `usuario_id` de la sesión.
- Crear, editar y eliminar también revisa que el registro pertenezca al usuario actual.
- Las contraseñas no se guardan directamente; se guardan protegidas con `bcryptjs`.
- El buscador no incluye contraseñas ni datos privados innecesarios.

## Comandos útiles

Construir el backend:

```bash
cd backend
pnpm run build
```

Construir el frontend:

```bash
cd frontend
pnpm run build
```

Ejecutar el backend en modo normal:

```bash
cd backend
pnpm start
```

## Inicio de sesión con Google

El proyecto tiene preparada la opción para Google, pero está desactivada por defecto. Para usarla se necesita:

1. Crear un proyecto en Google Cloud.
2. Crear un Client ID para una aplicación web.
3. Agregar `http://localhost:4200` como origen autorizado.
4. Colocar el Client ID en el archivo `.env`.
5. Cambiar `GOOGLE_AUTH_ENABLED=false` a `GOOGLE_AUTH_ENABLED=true`.

Para una instalación normal se puede usar el inicio de sesión tradicional con usuario y contraseña.

## Notas finales

Este es un proyecto educativo para practicar una aplicación completa con frontend, backend y base de datos. Para usarlo en producción todavía se deben configurar correctamente el dominio, HTTPS, las claves secretas y las credenciales reales de Google.