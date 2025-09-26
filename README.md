<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="NestJS Logo" /></a>
</p>

[<p align="center"><b>Backend - Sistema de Gestión para Pastelería</b></p>](https://github.com/your-username/your-repo-name)

<p align="center">
  Backend robusto y escalable para una aplicación de pastelería, construido con NestJS, Prisma y TypeScript. Incluye autenticación JWT, gestión de roles, manejo de productos, órdenes, y mucho más.
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
  <a href="https://github.com/your-username/your-repo-name/actions/workflows/ci.yml" target="_blank"><img src="https://github.com/your-username/your-repo-name/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
</p>

---

## 📖 Tabla de Contenidos

- [Acerca del Proyecto](#-acerca-del-proyecto)
- [🚀 Tecnologías Principales](#-tecnologías-principales)
- [✨ Funcionalidades](#-funcionalidades)
- [🏁 Empezando](#-empezando)
  - [Prerrequisitos](#prerrequisitos)
  - [Instalación](#instalación)
- [🔧 Variables de Entorno](#-variables-de-entorno)
- [▶️ Uso](#-uso)
- [📚 Documentación de la API](#-documentación-de-la-api)
- [🛡️ Seguridad](#-seguridad)
- [📄 Licencia](#-licencia)

---

## 🎯 Acerca del Proyecto

Este proyecto es el corazón de un sistema de comercio electrónico para una pastelería. Proporciona una API RESTful para gestionar usuarios, productos, categorías y órdenes. Está diseñado para ser seguro, eficiente y fácil de mantener, siguiendo las mejores prácticas de desarrollo con NestJS.

## 🚀 Tecnologías Principales

Este proyecto está construido con tecnologías modernas y robustas:

- **[NestJS](https://nestjs.com/)**: Un framework progresivo de Node.js para construir aplicaciones eficientes y escalables.
- **[Prisma](https://www.prisma.io/)**: ORM de nueva generación para Node.js y TypeScript.
- **[PostgreSQL](https://www.postgresql.org/)**: Como sistema de gestión de base de datos.
- **[JWT (JSON Web Tokens)](https://jwt.io/)**: Para la autenticación segura y basada en tokens.
- **[Swagger (Scalar)](https://docs.nestjs.com/openapi/introduction)**: Para la generación automática de documentación de la API.
- **[TypeScript](https://www.typescriptlang.org/)**: Para un código más seguro y mantenible.

## ✨ Funcionalidades

- **Autenticación y Autorización**: Sistema completo de registro, inicio de sesión (`/auth/login`, `/auth/register`) y perfil de usuario (`/auth/profile`) protegido con JWT.
- **Gestión de Roles**: Roles de `CLIENTE`, `TRABAJADOR` y `ADMINISTRADOR` para controlar el acceso a endpoints críticos (ej. creación de productos).
- **Recuperación de Contraseña**: Flujo seguro para solicitar y restablecer contraseñas olvidadas.
- **Gestión de Productos**: Creación, búsqueda por nombre y categoría. La creación está restringida por rol.
- **Subida de Archivos**: Manejo de subida de imágenes para productos con `multipart/form-data`.
- **Seguridad**: Implementación de `Helmet` para cabeceras de seguridad, y `express-rate-limit` para prevenir ataques de fuerza bruta.
- **Documentación Interactiva**: Endpoints documentados con Scalar, accesibles en `/api`.

## 🏁 Empezando

Sigue estos pasos para tener una copia local del proyecto funcionando.

### Prerrequisitos

- Node.js (v18 o superior)
- pnpm (o npm/yarn)
- Docker (recomendado para la base de datos)

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd backend
    ```

2.  **Instala las dependencias:**
    ```bash
    pnpm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto a partir del ejemplo:
    ```bash
    cp .env.example .env
    ```
    Luego, edita el archivo `.env` con tus propias credenciales.

4.  **Inicia la base de datos (con Docker):**
    ```bash
    docker-compose up -d
    ```

5.  **Aplica las migraciones de la base de datos:**
    Esto creará las tablas en tu base de datos según el esquema de Prisma.
    ```bash
    npx prisma migrate dev
    ```

## 🔧 Variables de Entorno

El archivo `.env` es crucial para la configuración. Aquí están las variables principales que necesitas definir:

```env
# .env.example

# Base de Datos (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"

# Autenticación JWT
JWT_SECRET="TU_CLAVE_SECRETA_SUPER_SEGURA"
JWT_EXPIRES_IN="1d"

# Configuración del Servidor
PORT=3000

# Email (para recuperación de contraseña)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="user@example.com"
EMAIL_PASS="password"
```

## ▶️ Uso

Una vez instalado, puedes iniciar la aplicación en diferentes modos:

```bash
# Modo de desarrollo con hot-reload
$ pnpm run start:dev

# Modo de producción
$ pnpm run build
$ pnpm run start:prod
```

## 📚 Documentación de la API

La API está completamente documentada usando **Scalar**. Una vez que el servidor esté en funcionamiento, puedes acceder a la documentación interactiva en la siguiente URL:

**http://localhost:3000/api**

Desde allí, podrás ver todos los endpoints, sus parámetros, respuestas y probarlos directamente, incluyendo los endpoints protegidos con JWT.

## 🛡️ Seguridad

La seguridad es una prioridad en este proyecto. Se han implementado varias medidas:

- **Autenticación JWT**: Todas las rutas sensibles están protegidas.
- **Control de Acceso Basado en Roles (RBAC)**: Operaciones críticas como la creación de productos están restringidas a roles específicos.
- **Validación de Datos**: Se usan `class-validator` y `class-transformer` para asegurar que los datos de entrada sean válidos.
- **Protección de Cabeceras HTTP**: `Helmet` se utiliza para configurar cabeceras HTTP seguras.
- **Limitación de Tasa de Peticiones**: `express-rate-limit` previene ataques de fuerza bruta.

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

---

<p align="center">
  <b>Desarrollado con ❤️ usando NestJS y Prisma</b><br/>
  <i>Proyecto Académico de Pastelería</i>
</p>
