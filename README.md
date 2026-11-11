# MVP — Finanzas Personales

## Descripción

Aplicación web para la gestión de finanzas personales, desarrollada como proyecto académico utilizando metodología Scrum.

El sistema permitirá a los usuarios registrar ingresos y gastos, consultar sus movimientos financieros y visualizar un resumen de sus finanzas.

También contará con un rol de administrador para gestionar usuarios y categorías generales.

## Tecnologías

**Frontend**
- React
- Vite
- JavaScript
- CSS
- React Router

**Backend**
- Node.js
- Express
- JavaScript

**Base de datos**
- MySQL
- mysql2

**Autenticación y validación**
- JWT
- bcrypt
- Zod

**Herramientas**
- Git y GitHub
- GitHub Projects
- Visual Studio Code
- Postman

## Estructura del proyecto

```text
finanzas-personales/
├── frontend/
├── backend/
├── .gitignore
└── README.md
```

## Requisitos

- Node.js y npm
- Git
- MySQL (para las funcionalidades que requieren base de datos)

## Ejecución local

### Frontend

Desde la carpeta `frontend`:

```bash
npm install
npm run dev
```

La aplicación estará disponible normalmente en:

http://localhost:5173

### Backend

Desde la carpeta `backend`:

```bash
npm install
npm run dev
```

La API estará disponible en:

http://localhost:3000

## Organización del proyecto

El desarrollo se realiza mediante Scrum, con una duración de cuatro sprints.

Las historias de usuario se gestionan mediante GitHub Issues y Sub-issues.

Cada integrante trabaja en una rama independiente y propone sus cambios mediante Pull Requests.

## Funcionalidades planificadas

- Registro de usuarios
- Inicio y cierre de sesión
- Control de acceso por roles
- Registro de ingresos y gastos
- Consulta y gestión de transacciones
- Resumen financiero mensual
- Administración de usuarios y categorías

## Verificación

Las funcionalidades se verificarán manualmente mediante el navegador, Postman y consultas a MySQL.

No se implementarán pruebas automatizadas en el alcance inicial del MVP.

## Estado

Proyecto en desarrollo — Sprint 1.